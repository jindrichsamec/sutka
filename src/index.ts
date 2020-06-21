import { JSDOM } from "jsdom";
import mysql from "mysql";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const { MYSQL_HOSTNAME, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE } = process.env;

const connection = mysql.createConnection({
  host: MYSQL_HOSTNAME,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
});

connection.connect();

(async function main() {
  try {
    connection.query(
      `CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE}`,
      [MYSQL_DATABASE],
      (error) => {
        if (error) {
          console.error("CREATE DB Error", error);
          process.exit(1);
        }
      }
    );
    connection.query(`USE ${MYSQL_DATABASE}`, (error) => {
      if (error) {
        console.error("USE DB Error", error);
        process.exit(1);
      }
    });
    connection.query(
      "CREATE TABLE IF NOT EXISTS `occupancy` (`timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `pool` smallint(6) NOT NULL, `aquapark` smallint(6) NOT NULL, PRIMARY KEY (`timestamp`))",
      (error) => {
        if (error) {
          console.error("CREATE TABLE Error", error);
          process.exit(1);
        }
      }
    );

    const response = await fetch("https://www.sutka.eu", { method: "GET" });
    const responseBody = await response.text();

    const dom = new JSDOM(responseBody);

    const poolOccupancy = dom.window.document.querySelector(
      "#header > div.header-middle > div > div > div.col-sm-7 > div > strong:nth-child(4)"
    )?.textContent;
    const aquaparkOccupancy = dom.window.document.querySelector(
      "#header > div.header-middle > div > div > div.col-sm-7 > div > strong:nth-child(5)"
    )?.textContent;

    connection.query(
      "INSERT into occupancy SET ?",
      {
        pool: Number(poolOccupancy),
        aquapark: Number(aquaparkOccupancy),
      },
      (error, result) => {
        if (error) {
          console.error("INSERT Error", error);
          process.exit(1);
        } else {
          process.exit(0);
        }
      }
    );
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
