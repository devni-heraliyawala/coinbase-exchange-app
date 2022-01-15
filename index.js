const express = require("express");
const { CoinbasePro } = require("coinbase-pro-node");
const axios = require("axios").default;
var crypto = require("crypto");
const AWS = require("aws-sdk");
const config = require("./config/config.js");
const { v4: uuidv4 } = require("uuid");
var moment = require("moment");

const app = express();
app.use(express.json());

const client = new CoinbasePro(config.coinbase_auth_configs);

app.get("/", (req, res) => {
  client.rest.account.listAccounts().then((accounts) => {
    const message = `You can trade new "${accounts.length}" different pairs. `;
    console.log(message);
    res.send(message);
  });
});

app.get("/accounts/list", (req, res) => {
  client.rest.account
    .listAccounts()
    .then((accounts) => {
      res.send(accounts);
    })
    .catch((error) => {
      console.log("err", error);
      res.send("Accounts listing failed. Please retry").status(400);
    });
});

app.post("/transactions/list", (req, res) => {
  const { account_id } = req.body;
  client.rest.account
    .getAccountHistory(account_id)
    .then((history) => {
      res.send(history);
    })
    .catch((error) => {
      console.log("err", error);
      res.send("Transactions listing failed. Please retry").status(400);
    });
});

app.post("/money/transfer", (req, res) => {
  const { amount, currency, from, to } = req.body;
  const path = req.path;
  client.rest.profile
    .transferFunds({
      amount,
      currency,
      from,
      to,
    })
    .then((transfer_details) => {
      //insert to dynamo db : money transfer history
      AWS.config.update(config.aws_remote_config);

      const history_id = uuidv4();
      const docClient = new AWS.DynamoDB.DocumentClient();

      const params = {
        TableName: config.aws_table_name_money_transfer,
        Item: {
          History_Id: history_id,
          From: from,
          To: to,
          Currency: currency,
          Amount: amount,
        },
      };

      docClient.put(params, function (err, data) {
        if (err) {
          console.log("aws err", err);
          res.send({
            success: false,
            message: `Error: Server error. ${err?.message}`,
          });
        } else {
          // insert data to activity log
          const log_id = uuidv4();
          const params = {
            TableName: config.aws_table_name_activity_log,
            Item: {
              Log_Id: log_id,
              Path: path,
              Action: "fund-transfer",
              Data: JSON.stringify(req.body),
              Created_At: moment(new Date()).format("YYYY-MMM-DD hh:mm:ss"),
            },
          };

          docClient.put(params, function (err, data) {
            if (err) {
              console.log("aws err", err);
              res.send({
                success: false,
                message: `Error: Server error. ${err?.message}`,
              });
            } else {
              res.send({
                success: true,
                message: `Successfully transferred money from account ${from} to account ${to}`,
                history_id,
                log_id,
                ...req.body,
              });
            }
          });
        }
      });
    })
    .catch((error) => {
      console.log("err", error);
      res.send("Fund transfer failed. Please retry").status(400);
    });
});

app.post("/money/transfer/history", (req, res) => {
  const { profile_id } = req.body;
  //read from dynamo db : money transfer history
  AWS.config.update(config.aws_remote_config);
  const docClient = new AWS.DynamoDB.DocumentClient();
  
  const params = {
    TableName: config.aws_table_name_money_transfer
  };

  docClient.scan(params, function(err, data) {
    if (err) {
      res.send({
        success: false,
        message: `Error: Server error. ${err?.message}`
      });
    } else {
      const { Items } = data;
      res.send({
        success: true,
        message: `Loaded money transfer history by profile (${profile_id})`,
        history: Items
      });
    }
  });
});

app.get("/currency/list", (req, res) => {
  client.rest.currency
    .listCurrencies()
    .then((currencies) => {
      res.send(currencies);
    })
    .catch((error) => {
      console.log("err", error);
      res.send("Currency listing failed. Please retry").status(400);
    });
});

app.post("/order/place", (req, res) => {
  const { type, size, funds, product_id } = req.body;
  const path = req.path
  //sample hardcoded product-ids = ["BTC-USD","BTC-GBP","ETH-USD","ETH-BTC","ETH-GBP","ETH-USDC","BTC-USDC"]
  client.rest.order
    .placeOrder({
      type,
      size,
      funds,
      product_id,
      side: "buy",
    })
    .then((order) => {
      // insert data to activity log
      AWS.config.update(config.aws_remote_config);
      const docClient = new AWS.DynamoDB.DocumentClient();

      const log_id = uuidv4();

      const params = {
        TableName: config.aws_table_name_activity_log,
        Item: {
          Log_Id: log_id,
          Path: path,
          Action: "order",
          Data: JSON.stringify(req.body),
          Created_At: moment(new Date()).format("YYYY-MMM-DD hh:mm:ss"),
        },
      };

      docClient.put(params, function (err, data) {
        if (err) {
          console.log("aws err", err);
          res.send({
            success: false,
            message: `Error: Server error. ${err?.message}`,
          });
        } else {
          res.send({
            success: true,
            message: `Successfully placed the order.`,
            log_id,
            ...req.body,
            order
          });
        }
      });
    })
    .catch((error) => {
      console.log("err", error);
      res.send("Order placement failed. Please retry").status(400);
    });
});

app.get("/order/list", (req, res) => {
  client.rest.order
    .getOrders({
      status: "all",
      limit: 20,
    })
    .then((orders) => {
      res.send(orders);
    })
    .catch((error) => {
      console.log("err", error);
      res.send("Orders listing failed. Please retry").status(400);
    });
});

app.post("/history/activity-log", (req, res) => {
  const {  type } = req.body; // type : order, fund-transfer
  //read from dynamo db : activity log table
  AWS.config.update(config.aws_remote_config);
  const docClient = new AWS.DynamoDB.DocumentClient();
  
  const params = {
    TableName: config.aws_table_name_activity_log,
    FilterExpression: "#Action = :action_value",
    ExpressionAttributeNames: {
        "#Action": "Action",
    },
    ExpressionAttributeValues: { ":action_value": type}
  };

  docClient.scan(params, function(err, data) {
    if (err) {
      res.send({
        success: false,
        message: `Error: Server error. ${err?.message}`
      });
    } else {
      const { Items } = data;
      res.send({
        success: true,
        message: `Loaded activity logs by type ${type}`,
        logs: Items
      });
    }
  });
});

app.listen(3000, function () {
  console.log("listening on 3000");
});

// test comment