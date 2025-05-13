import { ActivityType, Client, Events } from "discord.js";
import { BotEvent } from "../types";
import { color } from "../util/util";

const event: BotEvent = {
  name: Events.ClientReady,
  once: true,
  execute: (client: Client) => {
    if (!client.user) throw new Error("Client user is undefined");
    client.user.setActivity("Koen", { type: ActivityType.Watching });

    console.log(
      color("text", `💪 Logged in as ${color("variable", client.user?.tag)}`),
    );
  },
};

export default event;
