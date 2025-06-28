import { Variable } from "astal";
import { Gtk } from "astal/gtk3";
import AstalNotifd from "gi://AstalNotifd";
import MaterialIcon from "../../widgets/MaterialIcon";

const MAX_SUMMARY_LENGTH = 50;
const MAX_SUMMARY_LINES = 1;
const MAX_BODY_UNHOVERED_LENGTH = 60;
const MAX_BODY_UNHOVERED_LINES = 1;
const MAX_BODY_HOVERED_LENGTH = 150;
const MAX_BODY_HOVERED_LINES = 5;

interface NotificationBoxProps {
  notifd: AstalNotifd.Notifd;
  notification: AstalNotifd.Notification;
  hide: () => void;
}

const urgencyToClass = (urgency: AstalNotifd.Urgency) => {
  switch (urgency) {
    case AstalNotifd.Urgency.LOW:
      return "border";
    case AstalNotifd.Urgency.NORMAL:
      return "border-primary";
    case AstalNotifd.Urgency.CRITICAL:
      return "border-error";
  }
}

const NotificationImage = ({ image }: { image?: string }) => {
  if (!image) {
    return <MaterialIcon
      icon="notifications"
      className="icon-xxl"
    />
  } else {
    return <box
      halign={Gtk.Align.START}
      valign={Gtk.Align.START}
      className="rounded-lg"
      css="font-size: 2.73rem;"
      child={<icon icon={image} pixelSize={12} iconSize={12} />}
    />
  }
}

export default ({ notifd, notification, hide }: NotificationBoxProps) => {
  const isHoveredBind = Variable(false);

  const runAction = (action?: AstalNotifd.Action) => {
    if (action) {
      notification.invoke(action.id);
    }

    if (!notification.resident) {
      notification.dismiss();
    }
  }

  return (
    <eventbox
      name={`notification-${notification.id}`}
      onClick={() => {
        const firstAction = notification.actions[0];
        runAction(firstAction)
      }}
      onHover={() => {
        isHoveredBind.set(true);
      }}
      onHoverLost={() => {
        isHoveredBind.set(false);
      }}
      child={
        <box
          spacing={10}
          className={`frosted-glass text-surface p-md rounded-lg ${urgencyToClass(notification.urgency)}`}
          css="min-width: 30.682rem;"
          orientation={Gtk.Orientation.HORIZONTAL}
        >
          <box
            halign={Gtk.Align.START}
            valign={Gtk.Align.START}
            child={
              <NotificationImage image={notification.image} />
            }
          />
          <box orientation={Gtk.Orientation.VERTICAL}>
            <label
              className="font-bold"
              label={notification.summary}
              halign={Gtk.Align.START}
              lines={MAX_SUMMARY_LINES}
              maxWidthChars={MAX_SUMMARY_LENGTH}
              truncate
            />
            <label
              halign={Gtk.Align.START}
              justifyFill={true}
              label={notification.body}
              singleLineMode={isHoveredBind().as((isHovered) => {
                return !isHovered;
              })}
              lines={isHoveredBind().as((isHovered) => {
                return isHovered ? MAX_BODY_HOVERED_LINES : MAX_BODY_UNHOVERED_LINES;
              })}
              maxWidthChars={isHoveredBind().as((isHovered) => {
                return isHovered ? MAX_BODY_HOVERED_LENGTH : MAX_BODY_UNHOVERED_LENGTH;
              })}
              truncate
              wrap={true}
            />
            <box
              css="margin-top: 10px;"
              visible={notification.actions && notification.actions.length > 0}
              orientation={Gtk.Orientation.HORIZONTAL}
              spacing={5}
            >
              {notification.actions?.map((action) => {
                return (
                  <button
                    child={<label label={action.label} />}
                    className="btn-neutral"
                    onClick={() => {
                      runAction(action);
                    }}
                  />
                )
              })}
            </box>
          </box>
        </box>
      }
    />
  )
}
