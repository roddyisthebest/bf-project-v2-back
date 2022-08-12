import schedule from 'node-schedule';
import moment from 'moment';
import fs from 'fs';
import { User } from '../model/user';
import { Op } from 'sequelize';
import { Service } from '../model/service';
import { Tweet } from '../model/tweet';
import { Penalty } from '../model/penalty';
import { Pray } from '../model/pray';

const weekOfMonth = (m: any) =>
  moment(m).week() - moment(m).startOf('month').week() + 1;
// const nowDate = moment('2022-03-06');

const update = () =>
  schedule.scheduleJob('0 9 16 * * FRI', async function () {
    try {
      const users = await User.findAll({
        where: { admin: { [Op.not]: true } },
        include: {
          model: Service,
          attributes: ['penalty'],
        },
      });
      const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');

      const lastWeekend = moment(yesterday).day(0).format('YYYY-MM-DD');
      const weekend = moment().day(0).format('YYYY-MM-DD');
      let penaltyUsers = users.filter((e: any) => e.Service.penalty);
      penaltyUsers.map(async (user) => {
        // 전날 weekend로 특정 유저의 게시물 가져오기
        let tweetsInWeek = await Tweet.findAll({
          where: {
            weekend: lastWeekend,
            UserId: user.id,
          },
        });

        // 일요일에 업로드된 게시물 핉터링
        tweetsInWeek = tweetsInWeek.filter(
          (e: any) => moment(e.createdAt).day() !== 0
        );

        // 일주일 간 제출건수로 계산
        let pay = 1000 * (6 - tweetsInWeek.length);

        // 사진 x 글로만 업로드된거 500원 계산 (홀수달 첫째주는 예외)
        if (
          !(weekOfMonth(yesterday) === 1 && (moment().month() + 1) % 2 === 1)
        ) {
          tweetsInWeek.map((e: any) => {
            if (e.img.length === 0) {
              pay += 500;
            }
          });
        }

        const penalty: any = await Penalty.findOne({
          where: { UserId: user.id, weekend: lastWeekend },
        });

        if (!user.payed) {
          pay += penalty.paper;
        }

        await Penalty.create({
          paper: pay,
          weekend,
          UserId: user.id,
        });

        await User.update(
          {
            payed: pay ? false : true,
          },
          {
            where: {
              id: user.id,
            },
          }
        );
      });
      let prayUsers = users.filter((e: any) => e.Service.pray);

      prayUsers.map(async (user) => {
        await Pray.create({
          UserId: user.id,
          weekend: moment().day(0).format('YYYY-MM-DD'),
          content: 'default',
        });
      });

      console.log(weekend);
      console.log(weekOfMonth(weekend));
      if (weekOfMonth(weekend) === 2 || weekOfMonth(weekend) === 3) {
        const tweets = await Tweet.findAll();
        tweets.map((tweet: any) => {
          fs.unlink(tweet.img.replace('img', 'uploads'), (err) =>
            err ? console.error(err) : console.log('사진이 성공적으로 삭제')
          );
        });
        await Tweet.destroy({ where: {}, truncate: true });
      }
    } catch (e) {
      console.log(e);
    }
  });

const alarm = () =>
  schedule.scheduleJob('0 30 11 * * SAT', async function () {
    // 푸시 알림 관련 코드 기재
  });

export { update };
