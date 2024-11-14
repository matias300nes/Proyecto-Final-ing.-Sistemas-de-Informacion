const db = require("../db");
const schedule = require("node-schedule")
const pubsub = require("./pubsub");
const { Op } = require("sequelize");
const transporter = require("./mailerTransporter");
const fs = require("fs");
const ejs = require("ejs");
const path = require("path");
const DataLoader = require("dataloader");

const userLoader = new DataLoader(async (ids) => {
  const users = await db.User.findAll({
    where: {
      id: [...new Set(ids)],
    },
  });
  return ids.map((id) => users.find((u) => u.id == id));
}, { cache: false });

class NotificationHandler {
  constructor() {
    this.notifications = [];
    this.currentJob = null;
  }

  async refresh() {
    if (this.currentJob) {
      this.currentJob.cancel();
    }

    let notifications = await db.Notificacion.findAll({
      where: {
        programmedAt: {
          [Op.gt]: new Date()
        }
      },
      order: [
        ['programmedAt', 'ASC']
      ],
    });

    this.notifications = notifications;

    this.schedule();
  }

  async #sendEmail(notification) {
    const plantilla = fs.readFileSync(
      path.join(__dirname, "../../templates/email.ejs"),
      "utf-8"
    );
    const data = {
      header: notification.header || "Nueva notificación",
      titulo: notification.header || "Nueva notificación",
      mensaje: notification?.body || "",
      accion: "Ir a la app",
      url: notification.url || "https://dominio.com.ar",
      noButton: false,
    };
    const html = ejs.render(plantilla, { data });
    const users = await userLoader.loadMany(notification.users);
    const userEmails = users.map((user) => user.email);
    const mailOptions = {
      from: "Remitente <test@dominio.com.ar>",
      to: userEmails.join(","),
      subject: notification.header || "Tienes una nueva notificación",
      html: html,
    };

    transporter.sendMail(mailOptions).catch((error) => {
      db.Notificacion.update({ mailError: error }, { where: { id: notification.id } });
    });
  }

  async send(input) {
    let notification = input;
    if (!input.id) {
      notification = await db.Notificacion.create(input);
    }

    if (notification.programmedAt <= new Date()) {
      if (notification.channels.includes("email")) {
        this.#sendEmail(notification);
      }
      if (notification.channels.includes("app")) {
        pubsub.publish("NOTIFICATION", { notificaciones: notification });
      }
    } else {
      this.refresh();
    }

    return notification;
  }

  schedule() {
    let firstNotification = this.notifications[0];
    if (firstNotification) {
      this.currentJob = schedule.scheduleJob(firstNotification.programmedAt, () => {
        let notifications = this.notifications.filter(n => n.programmedAt === firstNotification.programmedAt);
        notifications.forEach(n => {
          this.send(n);
        });
        let ids = notifications.map(n => n.id);
        this.notifications = this.notifications.filter(n => !ids.includes(n.id));
        this.schedule();
      });
    }
  }
}

let notificationHandler = new NotificationHandler();
notificationHandler.refresh();

module.exports = notificationHandler;