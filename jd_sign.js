// version v0.0.1
// create by zhihua
// detail url: https://github.com/ruicky/jd_sign_bot

const exec = require('child_process').execSync
const fs = require('fs')
// const rp = require('request-promise')
const download = require('download')
const nodemailer = require('nodemailer')


// 京东Cookie
const cookie = process.env.JD_COOKIE
// 京东Cookie
const dual_cookie = process.env.JD_DUAL_COOKIE
// Server酱SCKEY
// const push_key = process.env.PUSH_KEY
const mail_addr_1 = process.env.MAIL_ADDR;
const mail_key_1 = process.env.MAIL_KEY;

const mail_addr_2 = process.env.MAIL_ADDR_2;
const mail_key_2 = process.env.MAIL_KEY_2;

// 京东脚本文件
const js_url = 'https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js'
// 下载脚本路劲
const js_path = './JD_DailyBonus.js'
// 脚本执行输出路劲
const result_path = './result.txt'
// 错误信息输出路劲
const error_path = './error.txt'

Date.prototype.Format = function (fmt) {
  var o = {
    'M+': this.getMonth() + 1,
    'd+': this.getDate(),
    'H+': this.getHours(),
    'm+': this.getMinutes(),
    's+': this.getSeconds(),
    'S+': this.getMilliseconds()
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(String(o[k]).length)));
    }
  }
  return fmt;
};

function dateFormat() {
  var timezone = 8;
  var GMT_offset = new Date().getTimezoneOffset();
  var n_Date = new Date().getTime();
  var t_Date = new Date(n_Date + GMT_offset * 60 * 1000 + timezone * 60 * 60 * 1000);
  console.log(t_Date)
  return t_Date.Format('yyyy.MM.dd')
}

function setupCookie() {
  var js_content = fs.readFileSync(js_path, 'utf8')
  js_content = js_content.replace(/var Key = ''/, `var Key = '${cookie}'`)
  if (dual_cookie) {
    js_content = js_content.replace(/var DualKey = ''/, `var DualKey = '${dual_cookie}'`)
  }
  fs.writeFileSync(js_path, js_content, 'utf8')
}

async function sendEmail(subject, text) {

  let transporter_1 = nodemailer.createTransport({
    host: "smtp.qq.com",
    port: 587,
    secure: false, 
    auth: {
      user: mail_addr_1, 
      pass: mail_key_1, 
    },
  });
  let transporter_2 = nodemailer.createTransport({
    host: "smtp.qq.com",
    port: 587,
    secure: false, 
    auth: {
      user: mail_addr_2, 
      pass: mail_key_2, 
    },
  });

  console.log("成功创建邮件对象");

  let info_1 = await transporter_1.sendMail({
    from: mail_addr_1,
    to: mail_addr_1,
    subject: subject,
    text: text,
  });

  let str = text.substring(text.search("【签到号二】"),txt.length);

  let info_2 = await transporter_2.sendMail({
    from: mail_addr_2,
    to: mail_addr_2,
    subject: subject,
    text: str,
  });
  console.log("Message sent: %s", info_1.messageId);
  console.log("Message sent: %s", info_2.messageId);
}

function sendNotificationIfNeed() {

  if (!mail_addr_2 && !mail_key_2) {
    console.log('缺少推送key，任务结束！'); return;
  }

  if (!fs.existsSync(result_path)) {
    console.log('没有执行结果，任务中断!'); return;
  }

  let text = "京东签到_" + dateFormat();
  let desp = fs.readFileSync(result_path, "utf8")

  // 去除末尾的换行
  // let SCKEY = push_key.replace(/[\r\n]/g, "")
  // const options = {
  //   uri: `https://sc.ftqq.com/${SCKEY}.send`,
  //   form: { text, desp },
  //   json: true,
  //   method: 'POST'
  // }


  sendEmail(text, desp)
    .then(() => {console.log("邮件发送成功！")})
    .catch(err => {
    console.log("邮件发送失败：");
    console.log(err);
  });

  // rp.post(options).then(res => {
  //   const code = res['errno'];
  //   if (code == 0) {
  //     console.log("server酱通知发送成功，任务结束！")
  //   }
  //   else {
  //     console.log(res);
  //     console.log("server酱通知发送失败，任务中断！")
  //     fs.writeFileSync(error_path, JSON.stringify(res), 'utf8')
  //   }
  // }).catch((err) => {
  //   console.log("server酱通知发送失败，任务中断！")
  //   fs.writeFileSync(error_path, err, 'utf8')
  // })
}



async function main() {

  if (!cookie) {
    console.log('请配置京东cookie!'); return;
  }

  await download(js_url, './').catch((err) => {
    console.log('脚本文件下载失败，任务中断！');
    fs.writeFileSync(error_path, err, 'utf8')
  });

  await setupCookie();
  await exec(`node ${js_path} >> ${result_path}`);
  await sendNotificationIfNeed();

}

main();
