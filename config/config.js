module.exports = {
  aws_table_name_money_transfer: "Money_Transfer_History",
  aws_table_name_activity_log: "Activity_Log",
  aws_remote_config: {
    accessKeyId: "AKIA6ISBXJDDZWXHNPZY",
    secretAccessKey: "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",
    region: "us-east-2",
  },
  coinbase_auth_configs: {
    apiKey: "67e92a3aca8f4bff7cdbdb177024ed56",
    apiSecret:
      "UXw0MF0fQS4f+cLPLXVCp/LiWrT7B8Bx8f+85uNGaCPMlXFvOygcKi12GqGFeJm3FgfsFbhRmP+anZHpo/Kdeg==",
    passphrase: "80hrcowfwr3",
    useSandbox: true,
  },
  coinbase_auth_to_acc_configs: {
    apiKey: "bcf2ee340d87f7e433cdd13e1593512f",
    apiSecret:
      "5w5A/c5ZL1PvtMBrCwkcCoJlVgOkCoDAAZFQAFKzkksapkPWC6BvSzO1M713j7BQ84/oTr6L58rklHjOxle1iQ==",
    passphrase: "hiw0ja4x8kp",
    useSandbox: true,
  },
  mysql_configs_aws: {
    host: "aws-database-instance-1.c1t6oa0bwghn.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "Abcd1234",
    database: "coinbase_exchange_db",
    multipleStatements: true,
  },
  mysql_configs_dev: {
    host: "localhost",
    user: "root",
    password: "",
    database: "coinbase_exchange_db_dev",
    insecureAuth : true,
    flags: '-SECURE_CONNECTION',
    multipleStatements: true,
  },
  mysql_configs_test: {
    host: "mysql.default.svc.cluster.local:3306",
    user: "admin",
    password: "Abcd1234",
    database: "coinbase_exchange_db_test",
    multipleStatements: true,
  },
  mysql_configs_prod: {
    host: "mysql.default.svc.cluster.local:3306",
    user: "admin",
    password: "Abcd1234",
    database: "coinbase_exchange_db_prod",
    multipleStatements: true,
  },
};
