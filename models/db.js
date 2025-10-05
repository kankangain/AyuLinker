const mysql = require("mysql2");

let connection;

function handleDisconnect() {
  connection = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "1234",
    database: process.env.DB_NAME || "AyuLinker",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  connection.connect((err) => {
    if (err) {
      console.error("❌ Database connection failed:", err.stack);
      setTimeout(handleDisconnect, 2000);
    }else 
      console.log("✅ Connected to database.");
  });
  connection.on("error", (err) => {
    console.error("DB error", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST")
      handleDisconnect();
    else
      throw err;
  });
}

handleDisconnect();

module.exports = connection;
