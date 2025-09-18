import { OmeggaPlugin, OL, PS, PC, OmeggaPlayer, WriteSaveObject, Vector, UnrealString } from 'omegga';
import CooldownProvider from './util.cooldown.js';
import { appendFileSync, writeFileSync } from 'node:fs';

// plugin config and storage
type Config = {
  'only-authorized': boolean;
  'authorized-users': { id: string; name: string }[];
  'authorized-roles': string[];
  cooldown: number;
};


type Storage = {
  playersInRPChat: OmeggaPlayer[];
  currentFileForRPChat?: string | null;
};


export default class Plugin implements OmeggaPlugin<Config, Storage> {
  omegga: OL;
  config: PC<Config>;
  store: PS<Storage>;

  constructor(omegga: OL, config: PC<Config>, store: PS<Storage>) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;

    store.set("playersInRPChat", []);
  }

  formattedMessage(msg: string) {
    return `[<b><color="#1c62d4">MERPaverse Manager</></>] ${msg}`;
  }

  async init() {

    const duration = Math.max(this.config.cooldown * 1000, 0);
    const cooldown = duration <= 0 ? () => true : CooldownProvider(duration);

    const authorized = (name: string) => {
      const player = this.omegga.getPlayer(name);
      return (
        !this.config['only-authorized'] ||
        player.isHost() ||
        this.config['authorized-users'].some(p => player.id === p.id) ||
        player
          .getRoles()
          .some(role => this.config['authorized-roles'].includes(role))
      );
    };

    this.omegga
      .on("cmd:dmc", async (name: string, ...contents) => {
        const player = this.omegga.getPlayer(name);

        if (!authorized(name)) {
          this.omegga.whisper(player, this.formattedMessage("Unauthorised"));
          return;
        }

        let players = await this.store.get("playersInRPChat");
        const playersIds = players.map(e => e.id);
        if (playersIds.includes(player.id)) {
          const content = OMEGGA_UTIL.chat.parseLinks(OMEGGA_UTIL.chat.sanitize(contents.join(" ")));
          this.handleRPChatMessages(player, content);
        } else {
          this.omegga.whisper(player, this.formattedMessage("Not in RP Chat"));
        }
      })
      .on("chatcmd:dmerp-h", (name: string) => {
        const player = this.omegga.getPlayer(name);
        if (!authorized(name)) {
          this.omegga.whisper(player, this.formattedMessage("Unauthorised"));
          return;
        }

        if (!cooldown(name)) {
          this.omegga.whisper(player, this.formattedMessage("Commands on cooldown."));
          return;
        }

        this.cmdHelp(player);
      })
      .on("chatcmd:dmerp-rp", (name: string, option: string) => {
        const player = this.omegga.getPlayer(name);
        if (!authorized(name)) {
          this.omegga.whisper(player, this.formattedMessage("Unauthorised"));
          return;
        }

        if (!cooldown(name)) {
          this.omegga.whisper(player, this.formattedMessage("Commands on cooldown."));
          return;
        }

        this.cmdHandleChat(player, option);
      })
      // Statistic Brick
      .on("chatcmd:dmerp-stat", (name: string, size: string, av: string, ap: string) => {
        const player = this.omegga.getPlayer(name);
        if (!authorized(name)) {
          this.omegga.whisper(player, this.formattedMessage("Unauthorised"));
          return;
        }

        if (!cooldown(name)) {
          this.omegga.whisper(player, this.formattedMessage("Commands on cooldown."));
          return;
        }

        try {
          this.omegga.whisper(player, this.formattedMessage("Generating Statistics Brick"));
          const avNo = parseInt(av);
          const apNo = parseInt(ap);

          if (Number.isNaN(avNo) || Number.isNaN(apNo)) {
            this.omegga.whisper(player, this.formattedMessage("AV or AP was not a <b>WHOLE</b> number."));
          }
          this.cmdStatBrick(player, size, avNo, apNo);
        } catch (ex) {
          console.error("An eror occured in dmerp:stat", ex);
        }
      })
      // Combat roll
      .on("chatcmd:dmerp-combat", (name: string, av: string, ap: string) => {
        const player = this.omegga.getPlayer(name);
        if (!authorized(name)) {
          this.omegga.whisper(player, this.formattedMessage("Unauthorised"));
          return;
        }

        if (!cooldown(name)) {
          this.omegga.whisper(player, this.formattedMessage("Commands on cooldown."));
          return;
        }

        try {
          const avNo = parseInt(av);
          const apNo = parseInt(ap);

          if (Number.isNaN(avNo) || Number.isNaN(apNo)) {
            this.omegga.whisper(player, this.formattedMessage("AV or AP was not a <b>WHOLE</b> number."));
          }
          this.cmdCombatRoll(player, avNo, apNo);
        } catch (ex) {
          console.error("An eror occured in dmerp:combat", ex);
        }
      });
  }

  async handleRPChatMessages(player: OmeggaPlayer, message: string) {
    const players = await this.store.get("playersInRPChat");

    const rpChatFormat = (sendingPlayer: OmeggaPlayer, msg: string) => {
      const sendingPlayerColour = sendingPlayer.getNameColor();
      return `[<b><color="#1c62d4">RP Chat</></>] <color="${sendingPlayerColour}">${sendingPlayer.name}</>: ${msg}`;
    }

    const writeToChatLog = async (event: object) => {
      const fileName = await this.store.get("currentFileForRPChat");

      if (fileName != null) {
        appendFileSync(fileName, JSON.stringify(event) + "\n", "utf8");
      }
      else {
        const currentDate = new Date();
        const newFileName = `RPChatLog-${this.formatDateForFilename(currentDate)}.json`;
        this.store.set("currentFileForRPChat", newFileName);

        writeFileSync(newFileName, "[\n" + JSON.stringify(event) + ",\n", "utf8");
      }

    }

    const currentDate = new Date();
    writeToChatLog({ dateTime: currentDate.toISOString(), user: player.name, message: message });
    console.log("RP Chat:", player.name, message);
    players.map((p) => {
      this.omegga.whisper(p.name, rpChatFormat(player, message));
    });
  }

  formatDateForFilename(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, "0");

    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());

    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }

  async cmdHelp(player: OmeggaPlayer) {
    const commandsList = [
      `<color="#ffee00ff">/dmc message</>`,
      `Send a message in the RP chat, if you have joined.`,
      `<color="#ffee00ff">!dmerp-h</>`,
      `You have just used it.`,
      `<color="#ffee00ff">!dmerp-rp option</>`,
      `Allows you to join or leave the RP Chat`,
      `Options:`,
      `• join, JOIN, j, J`,
      `• leave, LEAVE, l, L`,
      `<color="#ffee00ff">!dmerp-stat size av ap</>`,
      `Generates a statistics brick of your selected size. The colour is the one selected in you painter but with the glow material.`,
      `• size: large/l, medium/m, small/s`,
      `• av: 0-8`,
      `• ap: 0-8`,
      `<color="#ffee00ff">!dmerp-combat av ap</>`,
      `Makes a combat roll. The person whom did the command is the attacker.`,
      `• av: 0-8`,
      `• ap: 0-8`,
    ];

    this.omegga.whisper(player, this.formattedMessage("Command list:"));
    commandsList.map(message => {
      this.omegga.whisper(player, message);
    });
  }

  async cmdHandleChat(player: OmeggaPlayer, option: string) {
    if (["join", "j"].includes(option.toLowerCase())) {
      let players = await this.store.get("playersInRPChat");
      const playersIds = players.map(e => e.id);

      if (playersIds.includes(player.id)) {
        this.omegga.whisper(player, this.formattedMessage("You are already in the RP chat"));
        return;
      }

      players.push(player);
      this.store.set("playersInRPChat", players);
      this.omegga.whisper(player, this.formattedMessage(`You have <color="#17ad3f">joined</> the RP Chat.`));
    } else if (["leave", "l"].includes(option.toLowerCase())) {
      let players = await this.store.get("playersInRPChat");
      players = players.filter(e => e.id != player.id);
      this.store.set("playersInRPChat", players);
      this.omegga.whisper(player, this.formattedMessage(`You have <color="#ad1313">left</> the RP Chat.`));

      if (players.length <= 0) {
        try {
          const fileName = await this.store.get("currentFileForRPChat");
          appendFileSync(fileName, "]");

        } catch (e) {
          console.error("Last person left RP chat but file didn't exist.");
        } finally {
          this.store.set("currentFileForRPChat", null);
        }
      }
    }
  }

  async cmdCombatRoll(player: OmeggaPlayer, av: number, ap: number) {
    const player1Name = `<color="${player.getNameColor()}">${player.name}</>`;
    this.omegga.broadcast(this.formattedMessage(`${player1Name} is making a combat roll (attacking).`));

    // player running the command
    let attacker = this.getRandomInt(3, 18);
    const defender = this.getRandomInt(3, 18);

    if (ap > av) {
      const difference = ap - av;
      this.omegga.broadcast(this.formattedMessage(`<color="#de6b00">AP</> > <color="#dbc60b">AV</> applying a +${difference} to attacker roll.`));
      attacker += difference;
      if (attacker > 18) {
        attacker = 18;
      }
    }

    if (attacker === 3) {
      this.omegga.broadcast(this.formattedMessage(`${player1Name} rolled a <b>Critical Fail</>. No damage taken.`));
    }
    else if (defender === 3) {
      this.omegga.broadcast(this.formattedMessage(`Defender rolled a <b>Critical Fail</>. Double damage taken.`));
    }
    else if (attacker === 18) {
      const critDamage = ap + 1;
      this.omegga.broadcast(this.formattedMessage(`${player1Name} rolled a <b>Critical Hit</>. Damage resolved at ${critDamage > 8 ? "Double Damage" : `<color="#de6b00">AP</>: ${critDamage}`}.`));
    }
    else if (defender >= attacker) {
      this.omegga.broadcast(this.formattedMessage(`${player1Name}: ${attacker} vs. Defender: ${defender}. No damage taken.`));
    } else {
      this.omegga.broadcast(this.formattedMessage(`${player1Name}: ${attacker} vs. Defender: ${defender}. Damage taken.`));
    }
  }

  getRandomInt(min: number, max: number): number {
    // Inclusive of both min and max
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async cmdStatBrick(player: OmeggaPlayer, size: string, av: number, ap: number) {
    try {
      if (av < 0) {
        av = 0;
      }
      if (ap < 0) {
        av = 0;
      }
      if (av > 8) {
        av = 8;
      }
      if (ap > 8) {
        av = 8;
      }

      const interactLabel = {
        Component_Interact: {
          InteractSound: 'OBA_UI_Goal_Tune_Cue',
          Message: '<b>Stats</b>:\r\n' +
            `<color="#dbc60b">AV</color> : ${av}\r\n` +
            `<color="#de6b00">AP</color> : ${ap}`,
          ConsoleTag: '',
          bAllowNearbyInteraction: true,
          bHiddenInteraction: false,
          PromptCustomLabel: 'Statistics'
        }
      };

      let paint = await player.getPaint();
      paint.material = "BMC_Glow";

      const brickSize = this.getBrickSize(size);

      const brick: WriteSaveObject = {
        author: {
          id: player.id,
          name: player.name,
        },
        brick_assets: [
          brickSize.brickName
        ],
        materials: [
          "BMC_Glow"
        ],
        components: {
          Component_Interact: {
            version: 1,
            brick_indices: [0],
            properties: {
              InteractSound: 'Object',
              Message: 'String',
              ConsoleTag: 'String',
              bAllowNearbyInteraction: 'Boolean',
              bHiddenInteraction: 'Boolean',
              PromptCustomLabel: 'String'
            }
          }
        },
        bricks: [
          {
            material_index: 0,
            asset_name_index: 0,
            rotation: 0,
            position: [0, 0, 0],
            size: brickSize.brickSize,
            color: paint.color,
            components: interactLabel
          }
        ],
      };

      await this.omegga.loadSaveDataOnPlayer(brick, player);
    } catch (e) {
      this.omegga.whisper(player, this.formattedMessage(`Unable to create statistics brick.`));

      console.error("MERPaverse", e);
    }
  }

  async stop() {
    // this.announcementTimeouts.map((timeout) => {
    //   clearTimeout(timeout);
    // });
  }


  getBrickSize(size: string): { brickName: string, brickSize: Vector } {
    switch (size) {
      default:
      case "large":
      case "l":
        return {
          brickName: "PB_DefaultBrick",
          brickSize: [5, 5, 6]
        }
      case "medium":
      case "m":
        return {
          brickName: "B_1x1F_Round",
          brickSize: [5, 5, 3]
        }
      case "small":
      case "s":
        return {
          brickName: "PB_DefaultMicroBrick",
          brickSize: [1, 1, 1]
        }
    }
  }
}
