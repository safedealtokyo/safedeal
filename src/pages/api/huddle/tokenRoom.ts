import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { data } = await axios.post(
      "https://iriko.testing.huddle01.com/api/v1/join-room-token",
      {
        roomId: "wdz-fdhw-xqd",
        userType: "host"
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.HUDDLE_API_KEY
        }
      }
    );

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json(error);
  }
};

export default handler;
