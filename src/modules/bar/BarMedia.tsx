import { bind, Variable } from "astal";
import { Gtk } from "astal/gtk3";
import AstalMpris from "gi://AstalMpris";
import { ellipsisText } from "../../lib/string";
import { doubleDerive } from "../../lib/widget";
import MaterialIcon from "../../widgets/MaterialIcon";
import BarGroup from "./BarGroup";

const MAX_TITLE_LENGTH = 20;
const EMPTY_PLAYER_TITLE = "Nothing Playing";

export default () => {
  const mpris = AstalMpris.get_default();

  const firstPlayerBind = bind(mpris, "players").as((players) => {
    return players[0] ? players[0] : null;
  });

  const [titleBind] = doubleDerive(firstPlayerBind, (firstPlayer) => {
    if (!firstPlayer) {
      return Variable(EMPTY_PLAYER_TITLE)();
    }

    return bind(firstPlayer, "title").as((title) => {
      return title || EMPTY_PLAYER_TITLE
    });
  });
  const titleLabelBind = titleBind.as((title) => {
    return title;
  })

  const [playbackStatusBind] = doubleDerive(firstPlayerBind, (firstPlayer) => {
    if (!firstPlayer) {
      return Variable(AstalMpris.PlaybackStatus.STOPPED)();
    }

    return bind(firstPlayer, "playbackStatus").as((playbackStatus) => {
      return playbackStatus !== undefined ? playbackStatus : AstalMpris.PlaybackStatus.STOPPED;
    });
  });

  const playPauseIconBind = playbackStatusBind.as((playbackStatus) => {
    return playbackStatus === AstalMpris.PlaybackStatus.PLAYING ? "pause" : "play_arrow"
  });

  return (
    <BarGroup
      tooltipText={titleBind}
      orientation={Gtk.Orientation.HORIZONTAL}
      halign={Gtk.Align.CENTER}
      valign={Gtk.Align.CENTER}
      spacing={6}
    >
      <box
        halign={Gtk.Align.CENTER}
        valign={Gtk.Align.CENTER}
        child={
          <button
            className="btn-neutral rounded-full px-sm py-0"
            onClick={() => {
              mpris.players[0]?.play_pause()
            }}
            halign={Gtk.Align.CENTER}
            valign={Gtk.Align.CENTER}
            child={
              <MaterialIcon icon={playPauseIconBind} className="material-icon" />
            }
          />
        }
      />
      <label label={titleLabelBind} maxWidthChars={MAX_TITLE_LENGTH} truncate />
    </BarGroup>
  )
}
