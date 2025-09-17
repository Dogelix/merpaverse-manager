import { OmeggaPlugin, OL, PS, PC, OmeggaPlayer, DefinedComponents, WriteSaveObject } from 'omegga';

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

          console.log(size, av, ap, avNo, apNo);

          this.cmdStatBrick(player, size, avNo, apNo);
        } catch (ex) {
          console.error("An eror occured in dmerp:stat", ex);
        }
      });
  }

  async cmdStatBrick(player: OmeggaPlayer, size: string, av: number, ap: number) {
    try {
      const interactLabel = {
        bPlayInteractSound: true,
        Message: `<b>Stats</b>:
<color="#dbc60b">AV</color> : ${av}
<color="#de6b00">AP</color> : ${ap}`,
        ConsoleTag: '',
      };

      console.log(interactLabel);

      let paint = await player.getPaint();
      paint.material = "BMC_Glow";

      console.log(paint);

      const brick: WriteSaveObject = {
        author: {
          id: player.id,
          name: player.name,
        },
        brick_assets: [
          "PB_DefaultBrick"
        ],
        materials: [
          "BMC_Glow"
        ],
        components: {
          BCD_Interact: {
            version: 1,
            brick_indices: [0],
            properties: interactLabel
          }
        },
        bricks: [
          {
            material_index: 0,
            asset_name_index: 0,
            rotation: 0,
            position: [0, 0, 0],
            size: [5, 5, 6],
            color: paint.color,
            components: { BCD_Interact: interactLabel }
          }
        ],
      };

      console.log(brick);

      await this.omegga.loadSaveDataOnPlayer(brick, player);
    } catch (e) {
      this.omegga.whisper(player, `Unable to create statistics brick.`);

      console.log("MERPaverse", e);
    }
  }

  async stop() {
    // this.announcementTimeouts.map((timeout) => {
    //   clearTimeout(timeout);
    // });
  }
}
