"use strict";

const exchange_service = require("../service/exchange_service");

var controllers = {
  about: (req, res) => {
    exchange_service.info(req, res, (err, result) => {
      if (err) res.send(err);
      res.json(result);
    });
  },

  listAccounts: (req, res) => {
    exchange_service.accounts(req, res, (err, result) => {
      if (err) res.send(err);
      res.json(result);
    });
  },

  listAccountHistory: (req, res) => {
    exchange_service.accountHistory(req, res, (err, result) => {
      if (err) res.send(err);
      res.json(result);
    });
  },

  fundTransfer: (req, res) => {
    exchange_service.transferFunds(req, res, (err, result) => {
      if (err) res.send(err);
      res.json(result);
    });
  },

  fundTransferHistory: (req, res) => {
    exchange_service.transferFundsHistory(req, res, (err, result) => {
      if (err) res.send(err);
      res.json(result);
    });
  },

  listCurrencies: (req, res) => {
    exchange_service.currencies(req, res, (err, result) => {
      if (err) res.send(err);
      res.json(result);
    });
  },

  placeOrder: (req, res) => {
    exchange_service.orderCreate(req, res, (err, result) => {
      if (err) res.send(err);
      res.json(result);
    });
  },

  listOrders: (req, res) => {
    exchange_service.orders(req, res, (err, result) => {
      if (err) res.send(err);
      res.json(result);
    });
  },

  listActivityLogs: (req, res) => {
    exchange_service.activityLogs(req, res, (err, result) => {
      if (err) res.send(err);
      res.json(result);
    });
  }
};

module.exports = controllers;
