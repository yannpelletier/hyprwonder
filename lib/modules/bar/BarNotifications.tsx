import { bind } from "astal"
import { Gtk } from "astal/gtk3"
import AstalNotifd from "gi://AstalNotifd";
import MaterialIcon from "../../widgets/MaterialIcon"

export default () => {
  const notifd = AstalNotifd.get_default();
  const notificationsBind = bind(notifd, "notifications");

  return (
    <box
      halign={Gtk.Align.CENTER}
      valign={Gtk.Align.CENTER}
      child={
        <button
          halign={Gtk.Align.CENTER}
          valign={Gtk.Align.CENTER}
          className="btn-ghost rounded-full"
          onClick={() => {
            notificationsBind.get().forEach((notification) => {
              notification.dismiss();
            })
          }}
          child={
            <box
              child={
                <overlay>
                  <box
                    halign={Gtk.Align.CENTER}
                    valign={Gtk.Align.CENTER}
                    child={
                      <MaterialIcon icon="notifications" />
                    }
                  />
                  <box
                    className="rounded-full bg-error pulse"
                    css="min-width: 10px; min-height: 10px;"
                    visible={notificationsBind.as((notifications) => {
                      return notifications.length > 0;
                    })}
                    halign={Gtk.Align.END}
                    valign={Gtk.Align.START}
                  />
                </overlay>
              }
            />
          }
        />
      }
    />
  )
}
