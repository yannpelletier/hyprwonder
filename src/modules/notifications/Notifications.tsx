import { bind, derive, execAsync, timeout, AstalIO } from "astal";
import { App, Astal, Gtk } from "astal/gtk3";
import AstalNotifd from "gi://AstalNotifd";
import { VarSet } from "../../lib/varset";
import NotificationBox from "./NotificationBox";

import type { EventBoxProps } from "astal/gtk3/widget";
import type { BaseWindowProps } from "../../lib/widget";

const MAX_ONSCREEN_NOTIFICATIONS = 10;
const DEFAULT_TIMEOUT = 5000;
const DEFAULT_NOTIFICATION_SOUND = "assets/sounds/default-notification.mp3"

const NotificationsList = (props: EventBoxProps) => {
  const notifd = AstalNotifd.get_default();
  const dontDisturbBind = bind(notifd, "dontDisturb");
  const notificationsBind = bind(notifd, "notifications");
  const visibleIdsVar: VarSet<number> = new VarSet();
  const hideTimeouts: Map<number, AstalIO.Time> = new Map();

  const visibleNotificationsBind = derive([notificationsBind, visibleIdsVar, dontDisturbBind])().as(([notifications, visibleIds, dontDisturb]) => {
    if (dontDisturb) {
      return [];
    }

    return notifications.filter((notif) => {
      return visibleIds.some((id) => {
        return notif.id === id;
      });
    })
  })

  const playNotificationSound = async (notification: AstalNotifd.Notification) => {
    await execAsync(`paplay ${notification.soundFile || DEFAULT_NOTIFICATION_SOUND}`).catch((err) =>
      console.error(`Failed to play sound: ${err}`)
    );
  }

  const showNotification = (notification: AstalNotifd.Notification) => {
    visibleIdsVar.add(notification.id);
    startHideTimeout(notification);
  }

  const hideNotification = (notification: AstalNotifd.Notification) => {
    visibleIdsVar.delete(notification.id);
    clearHideTimeout(notification);
  }

  const clearHideTimeout = (notification: AstalNotifd.Notification) => {
    const hideTimeout = hideTimeouts.get(notification.id);
    if (hideTimeout === undefined) {
      return;
    }

    hideTimeout?.cancel();
    hideTimeouts.delete(notification.id);
  }

  const startHideTimeout = (notification: AstalNotifd.Notification, delay: number = 0) => {
    const hideTimeout = hideTimeouts.get(notification.id);
    if (hideTimeout instanceof AstalIO.Time) {
      return;
    }

    const newTimeout = timeout((notification.expireTimeout > 0 ? notification.expireTimeout : DEFAULT_TIMEOUT) + delay, () => {
      hideNotification(notification);
    });

    hideTimeouts.set(notification.id, newTimeout);
  };

  const pauseHideTimeout = (notification: AstalNotifd.Notification) => {
    const hideTimeout = hideTimeouts.get(notification.id);
    if (!hideTimeout) {
      return;
    }

    hideTimeout.cancel();
    hideTimeouts.delete(notification.id);
  };

  const startAllHideTimeouts = () => {
    const visibleIds = visibleIdsVar.get()
    visibleIds.forEach((id, i) => {
      const notif = notifd.get_notification(id);
      if (!notif) {
        return;
      }

      startHideTimeout(notif, i * 75);
    });
  }

  const pauseAllHideTimeouts = () => {
    const visibleIds = visibleIdsVar.get()
    visibleIds.forEach((id) => {
      const notif = notifd.get_notification(id);
      if (!notif) {
        return;
      }

      pauseHideTimeout(notif);
    });
  }


  notifd.connect("notified", (_, id, replaced) => {
    const notification = notifd.get_notification(id);
    if (!notification) {
      return;
    }

    showNotification(notification);
    if (!notification.suppressSound && !notifd.dontDisturb) {
      playNotificationSound(notification)
    }
  });

  notifd.connect("resolved", (_, id, reason) => {
    const notification = notifd.get_notification(id);
    if (!notification) {
      return;
    }

    clearHideTimeout(notification);
  })

  const notificationBoxesList = visibleNotificationsBind.as((notifications) => {
    return notifications.reverse().slice(0, MAX_ONSCREEN_NOTIFICATIONS).map((notification) => {
      return <NotificationBox
        notifd={notifd}
        notification={notification}
        hide={() => {
          clearHideTimeout(notification);
        }}
      />
    })
  })

  return (
    <eventbox
      {...props}
      onHover={() => {
        pauseAllHideTimeouts();
      }}
      onHoverLost={() => {
        startAllHideTimeouts();
      }}
      child={
        <box
          orientation={Gtk.Orientation.VERTICAL}
          spacing={5}
        >
          {notificationBoxesList}
        </box>
      }
    >
    </eventbox>
  );
}

export default ({ name, monitor }: BaseWindowProps) => {
  return (
    <window
      name={name}
      monitor={monitor}
      application={App}
      className="indicators"
      layer={Astal.Layer.OVERLAY}
      anchor={Astal.WindowAnchor.TOP}
      margin={5}
      child={
        <NotificationsList />
      }
    />
  )
}
