import { OmeggaPlugin, OL, PS, PC, OmeggaPlayer, DefinedComponents, WriteSaveObject, Vector } from 'omegga';

const publicUser = {
  id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  name: 'Generator',
};

// plugin config and storage
type Config = {
};


type Storage = {
};


export default class Plugin implements OmeggaPlugin<Config, Storage> {
  omegga: OL;
  config: PC<Config>;
  store: PS<Storage>;

  constructor(omegga: OL, config: PC<Config>, store: PS<Storage>) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;
  }

  formattedMessage(msg: string) {
    return `[<b><color="#1c62d4">MERPaverse Manager</></>] ${msg}`;
  }

  async init() {
    this.omegga
      // Statistic Brick
      .on("chatcmd:dmerp-stat", (name: string, size: string, av: string, ap: string) => {
        try {
          const player = this.omegga.getPlayer(name);
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
      });
  }

  async cmdStatBrick(player: OmeggaPlayer, size: string, av: number, ap: number) {
    try {
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
