const express = require("express");
const { CoinbasePro } = require("coinbase-pro-node");
const axios = require("axios").default;
var crypto = require("crypto");
const AWS = require("aws-sdk");
const config = require("./config/config.js");
const { v4: uuidv4 } = require("uuid");
var moment = require("moment");
var mysql = require("mysql");

const app = express();
app.use(express.json());

const client = new CoinbasePro(config.coinbase_auth_configs);

// SQL connection
var mysql_connection = mysql.createConnection(config.mysql_configs);

mysql_connection.connect((err) => {
  if (!err) console.log("Connection established successfully!");
  else console.log("Connection failed!" + JSON.stringify(err, undefined, 2));
});

app.get("/", (req, res) => {
  client.rest.account.listAccounts().then((accounts) => {
    const message = `You can trade(coinbase) new "${accounts.length}" different pairs.`;
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
      //insert to db : money transfer history
      const history_id = uuidv4();
      var sql =
        "INSERT INTO money_transfer_history(history_id,currency,from_account,to_account,amount) VALUES ?";
      var values = [[history_id, currency, from, to, amount]];

      mysql_connection.query(sql, [values], (err, rows, fields) => {
        if (!err) {
          // insert to db: activity logs
          const log_id = uuidv4();
          const action_type = "fund-transfer";
          const created_at = moment(new Date()).format("YYYY-MMM-DD hh:mm:ss");
          const data = JSON.stringify(req.body);

          var sql =
            "INSERT INTO activity_log(log_id,action_type,created_at,data,path) VALUES ?";
          var values = [[log_id, action_type, created_at, data, path]];

          mysql_connection.query(sql, [values], (err, rows, fields) => {
            if (!err) {
              res.send({
                success: true,
                message: `Successfully transferred money from account ${from} to account ${to}`,
                history_id,
                log_id,
                ...req.body,
              });
            } else {
              console.log("Database error", err);
              res.send({
                success: false,
                message: `Error: Server error. ${err?.message}`,
              });
            }
          });
        } else {
          console.log("Database error", err);
          res.send({
            success: false,
            message: `Error: Server error. ${err?.message}`,
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

  mysql_connection.query(
    "SELECT * FROM money_transfer_history",
    (err, rows, fields) => {
      if (!err) {
        res.send({
          success: true,
          message: `Loaded money transfer history by profile (${profile_id})`,
          history: rows,
        });
      } else {
        console.log("Database error", err);
        res.send({
          success: false,
          message: `Error: Server error. ${err?.message}`,
        });
      }
    }
  );
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
  const path = req.path;
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
      // insert to db: activity logs
      const log_id = uuidv4();
      const action_type = "order";
      const created_at = moment(new Date()).format("YYYY-MMM-DD hh:mm:ss");
      const data = JSON.stringify(req.body);

      var sql =
        "INSERT INTO activity_log(log_id,action_type,created_at,data,path) VALUES ?";
      var values = [[log_id, action_type, created_at, data, path]];

      mysql_connection.query(sql, [values], (err, rows, fields) => {
        if (!err) {
          res.send({
            success: true,
            message: `Successfully placed the order.`,
            log_id,
            ...req.body,
            order,
          });
        } else {
          console.log("Database error", err);
          res.send({
            success: false,
            message: `Error: Server error. ${err?.message}`,
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
  const { type } = req.body; // type : order, fund-transfer
  //read from  db : activity log table
  mysql_connection.query("SELECT * FROM activity_log WHERE action_type=?",[type],
    (err, rows, fields) => {
      if (!err) {
        res.send({
          success: true,
          message: `Loaded activity logs by type ${type}`,
          logs: rows,
        });
      } else {
        console.log("Database error", err);
        res.send({
          success: false,
          message: `Error: Server error. ${err?.message}`,
        });
      }
    }
  );
});

app.listen(3000, function () {
  console.log("listening on 3000");
});