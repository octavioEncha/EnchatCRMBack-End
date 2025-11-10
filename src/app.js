import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import routes from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(routes);
app.use(errorHandler);

export default app;
