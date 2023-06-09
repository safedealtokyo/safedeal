import type { NextApiRequest, NextApiResponse } from "next";

import { prisma } from "@/utils/prisma";

import { createIframeRoom } from "../../huddle/room";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { body } = req;
  if (req.method === "POST") {
    try {
      const roomData = await createIframeRoom();

      let user = await prisma.user.findUnique({
        where: {
          walletAddress: req.body.walletAddress,
        },
      });
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: "Sample Taro",
            email: "taro@example.com",
            walletAddress: req.body.walletAddress,
          },
        });
      }
      try {
        const worker = await prisma.worker.create({
          data: {
            roomId: roomData.data.roomId,
            walletAddress: req.body.walletAddress,
            deal: {
              connect: {
                id: req.body.dealId,
              },
            },
            userId: user.id,
          },
        });

        return res.status(200).json(worker);
      } catch (e) {
        // workerがいるかどうかの判定排除
        return res.status(200).json("already");
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json(error);
    }
  }
  return res.status(405).json({ error: "Method not allowed" });
}
