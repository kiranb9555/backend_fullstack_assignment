import request from "supertest";

import { app } from "../src/app.js";

describe(
  "Numbers module",
  () => {

    it(
      "health endpoint works",
      async () => {

        const response =
          await request(app)
            .get("/health");

        expect(
          response.status
        ).toBe(200);
      }
    );
  }
);