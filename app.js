import { Telegraf, Input } from "telegraf";
import { message as filter } from "telegraf/filters";
import ytdl from "ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import { unlinkSync } from "fs";
import { resolve } from "path";

const token = "5413815988:AAFsufO-bGsKCuz9dII3rvtixc_Easlt_QA";

const bot = new Telegraf(token);

const convertTime = (seconds) => {
  let min = ~~(seconds / 60);
  let sec = ~~(seconds % 60);
  let minute = min < 10 ? "0" + min : min;
  let second = sec < 10 ? "0" + sec : sec;
  return minute + ":" + second;
};

bot.start(async (ctx) => {
  try {
    const from = ctx.from?.id;
    await ctx.reply("Hi!\nplease send youtube link...");
  } catch (error) {
    console.error(error);
  }
});

bot.on(filter("text"), async (ctx) => {
  try {
    const { message } = ctx;
    await ctx.reply("wait...");
    const response = await ytdl.getInfo(message.text);
    const stream = ytdl(message.text, {
      quality: "highestaudio",
    });
    const {
      title,
      lengthSeconds,
      author: { name },
      thumbnails,
    } = response.videoDetails;
    const duration = convertTime(lengthSeconds);
    if (response) {
      const filename = resolve(`./downloads`, `${title}.mp3`);
      console.log(thumbnails);
      const thumb = thumbnails[thumbnails.length - 1].url;
      await ctx.replyWithPhoto(thumb, {
        caption: `عنوان: ${title}\nنام: ${name}\nتایم: ${duration}`,
      });
      await ctx.reply("wait to download...");
      ffmpeg(stream)
        .audioBitrate(320)
        .save(filename)
        .on("end", async () => {
          await ctx.reply("file downloaded wait to upload...");
          await ctx.replyWithChatAction("upload_document");
          await ctx.replyWithAudio(Input.fromLocalFile(filename), {
            thumbnail: Input.fromURLStream(thumb, "thumb.jpg"),
            title,
          });
          unlinkSync(filename);
        });
    }
  } catch (error) {
    console.error(error.message);
    await ctx.reply(error.message);
  }
});

bot.launch();
