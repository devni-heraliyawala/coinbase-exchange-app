"use strict";

const controller = require("../controllers/controller");

module.exports = (app) => {
  app.route("/").get(controller.about);
  app.route("/accounts/list").get(controller.listAccounts);
  app.route("/transactions/list").post(controller.listAccountHistory);
  app.route("/money/transfer").post(controller.fundTransfer);
  app.route("/money/transfer/history").post(controller.fundTransferHistory);
  app.route("/currency/list").get(controller.listCurrencies);
  app.route("/order/place").post(controller.placeOrder);
  app.route("/order/list").get(controller.listOrders);
  app.route("/history/activity-log").post(controller.listActivityLogs);
};
