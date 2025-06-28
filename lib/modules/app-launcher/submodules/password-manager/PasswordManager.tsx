import { bind, exec, execAsync, timeout, Variable } from "astal";
import { App, Astal, Gdk, Gtk } from "astal/gtk3";
import { escapeCLIArgument } from "../../lib/cli";
import { Router } from "../../lib/router";
import { copyToClipboard } from "../../lib/system";
import { BaseWindowProps, keyPressToBuffer } from "../../lib/widget";
import MaterialIcon from "../../widgets/MaterialIcon";
import { fileNameToDisplay } from "../../lib/string";

const PASSWORD_STORE_NAME = ".password-store";
const PASSWORD_STORE_DIR = `$HOME/${PASSWORD_STORE_NAME}`;
const CONTENT_ITEMS_ORDER = ["username", "email", "password", "otp"];

type Vault = {
  indentifier: string;
  content: string[];
}

export type PasswordManagerRoute = 
| { name: "search" }
| { name: "new-vault" }
| { name: "view-vault", selectedVault: Vault }
| { name: "edit-vault", selectedVault: Vault }
| { name: "delete-vault", selectedVault: Vault }

type PasswordManagerRouter = Router<PasswordManagerRoute>;

const queryPasswords = (query: string): Vault[] => {
  try {
    const output = exec(`sh -c 'find -L "${PASSWORD_STORE_DIR}" -type f -name "*.gpg" | grep "${query}"'`)
    return output
      .split("\n")
      .filter((line) => line.trim())
      .reduce((acc, line) => {
        const cleanedUp = line
          .replace(/.*\.password-store\//, '') // Remove everything up to and including .password-store/
          .replace(/\.gpg$/, '')

        const splitLine = cleanedUp.split("/");
        const identifier = splitLine.slice(0, splitLine.length - 1).join("/");
        if (identifier.length === 0) {
          return acc;
        }

        const itemName = splitLine[splitLine.length - 1];

        const existing = acc.find(item => {
          return identifier === item.identifier;
        });

        if (existing) {
          existing.content.push(itemName);
          return acc;
        }

        return [
          ...acc,
          {
            identifier,
            content: [itemName]
          }
        ];
      }, [] as Vault[])
      .map((vault) => {
        return {
          ...vault,
          content: orderContentItems(vault.content)
        }
      });
  } catch (e) {
    return [];
  }
};

const copyVaultSecret = async (credential: Vault, secretName: string) => {
  const id = `${credential.identifier}/${secretName}`;
  const secret = await execAsync(`pass show "${id}"`);
  copyToClipboard(secret);
  timeout(500, () => {
    exec(`cliphist delete-query "${secret}"`)
  })
}

const copyVaultOtp = async (credential: Vault) => {
  const id = `${credential.identifier}/otp`;
  const otp = await execAsync(`pass otp show "${escapeCLIArgument(id)}"`);
  copyToClipboard(otp);
};

const deleteVaultSecret = async (credential: Vault, secretName: string) => {
  const id = `${credential.identifier}/${secretName}`
  return await execAsync(`pass rm -f "${escapeCLIArgument(id)}"`);
};


const getContentItemIcon = (contentItem: string) => {
  if (contentItem.startsWith("login")) {
    return "person";
  } else if (contentItem.startsWith("username")) {
    return "person";
  } else if (contentItem.startsWith("email")) {
    return "email"
  } else if (contentItem.startsWith("otp")) {
    return "enhanced_encryption";
  } else if (contentItem.startsWith("password")) {
    return "key";
  }
  return "text_snippet"
}

const orderContentItems = (content: string[]) => {
  return content.sort((a, b) => {
    // Get the index of a and b in the priority list (-1 if not found)
    const indexA = CONTENT_ITEMS_ORDER.findIndex((prefix) => {
      return a.startsWith(prefix)
    });
    const indexB = CONTENT_ITEMS_ORDER.findIndex((prefix) => {
      return b.startsWith(prefix)
    });

    // If both are in priority list, sort by their order in priorityList
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only a is in priority list, it comes first
    if (indexA !== -1) {
      return -1;
    }
    // If only b is in priority list, it comes first
    if (indexB !== -1) {
      return 1;
    }
    // If neither is in priority list, sort alphabetically
    return a.localeCompare(b);
  });
}


const VaultForm = ({ vault }: { vault: Vault; }) => {

}

const SearchRoute = ({
  router,
}: {
  router: PasswordManagerRouter;
}) => {
  const queryVar = Variable("");
  const resultsVar = Variable(queryPasswords(""));
  let lastFocusId: string | null = null;

  const onQueryChange = (query: string) => {
    resultsVar.set(queryPasswords(query));
  }

  const handleKeyPress = (self: Gtk.Widget, event: Gdk.Event) => {
    if (keyPressToBuffer(queryVar, event)) {
      return true;
    }
    return false;
  };

  queryVar.subscribe((q) => {
    onQueryChange(q);
  });

  const title = (
    <box
      halign={Gtk.Align.CENTER}
      valign={Gtk.Align.CENTER}
      className="text-subtitle font-bold"
      spacing={5}
    >
      <MaterialIcon
        halign={Gtk.Align.CENTER}
        valign={Gtk.Align.CENTER}
        icon="key"
      />
      <label
        halign={Gtk.Align.CENTER}
        valign={Gtk.Align.CENTER}
        label="Password Manager"
      />
    </box>
  );

  const entry = (
    <box
      halign={Gtk.Align.FILL}
      valign={Gtk.Align.CENTER}
      hexpand={true}
      vexpand={false}
    >
      <box
        halign={Gtk.Align.FILL}
        valign={Gtk.Align.CENTER}
        hexpand={true}
        className="bg-surface text-base text-surface border p-sm"
        css="border-radius: 5px 0 0 5px; min-height: 15px;"
        spacing={8}
      >
        <MaterialIcon
          halign={Gtk.Align.START}
          valign={Gtk.Align.CENTER}
          icon="search"
          className="icon-md"
        />
        <label
          halign={Gtk.Align.START}
          valign={Gtk.Align.CENTER}
          hexpand={true}
          className="search-input"
          label={queryVar().as((query) => {
            return query || "Search Vaults"
          })}
        />
      </box>
      <button
        halign={Gtk.Align.END}
        valign={Gtk.Align.CENTER}
        hexpand={false} // Prevent button from expanding
        className="btn-neutral text-md p-sm"
        css="border-radius: 0 5px 5px 0; min-height: 15px;"
        onClicked={() => {
          router.push({ name: "new-vault" });
        }}
        child={
          <box spacing={8}>
            <MaterialIcon icon="enhanced_encryption" className="button-icon" />
            <label label="New Vault" />
          </box>
        }
      />
    </box>
  );

  const resultsHeader = (
    <box
      className="font-bold bg-background rounded py-sm px-md"
      spacing={8}
    >
      <box
        css="min-width: 100px;"
        child={<label label="Content" />}
      />
      <box
        child={<label label="Identifier" />}
      />
    </box>
  )

  const resultDisplay = (result: Vault) => {
    return (
      <box halign={Gtk.Align.FILL} spacing={8}>
        <box
          spacing={4}
          css="min-width: 100px;"
          children={result.content.map((contentItem) => {
            return <MaterialIcon icon={getContentItemIcon(contentItem)} />
          })}
        />
        <box
          child={<label label={fileNameToDisplay(result.identifier)} />}
        />
      </box>
    )
  }

  const resultsArea = (
    <scrollable
      css="min-height: 320px;"
      vscroll={Gtk.PolicyType.AUTOMATIC}
      hscroll={Gtk.PolicyType.NEVER}
      child={
        <box
          orientation={Gtk.Orientation.VERTICAL}
          spacing={6}
        >
          {resultsVar().as((items) => {
            const list = items.length > 0 ? items.map((item, index) => (
              <button
                className="px-base font-normal px-md py-sm btn-ghost-base btn-primary-focus btn-ghost-hover"
                halign={Gtk.Align.FILL}
                onFocus={() => {
                  lastFocusId = item.identifier;
                }}
                onMap={(self) => {
                  if (lastFocusId === item.identifier) {
                    self.grab_focus()
                  } else if (index === 0) {
                    self.grab_focus();
                  }
                }}
                onClicked={() => {
                  router.push({ name: "view-vault", selectedVault: item })
                }}
                child={resultDisplay(item)}
              />
            )) : ([
              <button
                label="No results found"
                className="bg-transparent border-none shadow-none text-md"
                halign={Gtk.Align.FILL}
                valign={Gtk.Align.CENTER}
                onRealize={(self) => {
                  self.grab_focus();
                }}
              />
            ]);
            return list;
          })}
        </box>
      }
    />
  )

  return (
    <box
      className="main-container"
      valign={Gtk.Align.CENTER}
      orientation={Gtk.Orientation.VERTICAL}
      spacing={12}
      onKeyPressEvent={(self, event) => {
        return handleKeyPress(self, event);
      }}
    >
      {title}
      {entry}
      {resultsHeader}
      {resultsArea}
    </box>
  )
}

const ViewVaultRoute = ({
  router,
  closeWindow
}: {
  router: PasswordManagerRouter;
  closeWindow: () => void;
}) => {
  const selectedVaultBind = bind(router, "currentRoute").as((currentRoute) => {
    if (!currentRoute || !("selectedVault" in currentRoute)) {
      return null;
    }
    return currentRoute.selectedVault;
  })

  const vaultDisplay = (vault: Vault) => {
    const contentButtons = (
      <>
        {
          vault.content.map((contentItem) => {
            let copying = false;
            return (
              <button
                className="btn-neutral"
                onClicked={async () => {
                  try {
                    if (copying) {
                      return;
                    }

                    closeWindow();
                    copying = true;
                    if (contentItem.startsWith("otp")) {
                      await copyVaultOtp(vault)
                    } else {
                      await copyVaultSecret(vault, contentItem);
                    }
                    copying = false;
                  } catch (e) {
                    console.log("Error copying secret ", e)
                    copying = false;
                  }
                }}
                child={
                  <box spacing={8}>
                    <MaterialIcon icon={getContentItemIcon(contentItem)} className="button-icon" />
                    <label label={`Copy ${fileNameToDisplay(contentItem)}`} />
                  </box>
                }
              />
            )
          })
        }
      </>
    )

    return (
      <box
        className="main-container"
        css="min-width: 350px;"
        valign={Gtk.Align.CENTER}
        orientation={Gtk.Orientation.VERTICAL}
        spacing={12}
      >
        <label label={`Vault: ${fileNameToDisplay(vault.identifier)}`} className="font-bold text-subtitle" />
        <box
          spacing={8}
          halign={Gtk.Align.FILL}
          orientation={Gtk.Orientation.VERTICAL}
        >
          {contentButtons}
          <box className="border" />
          <button
            className="btn-neutral"
            onClicked={() => router.push({ name: "edit-vault", selectedVault: vault })}
            child={
              <box spacing={8}>
                <MaterialIcon icon="edit" className="button-icon" />
                <label label="Edit" />
              </box>
            }
          />
          <button
            className="btn-destructive"
            onClicked={() => router.push({ name: "delete-vault", selectedVault: vault })}
            child={
              <box spacing={8}>
                <MaterialIcon icon="delete" className="button-icon" />
                <label label="Delete" />
              </box>
            }
          />
        </box>
      </box>
    )
  }

  return (
    <>
      {selectedVaultBind.as((selectedVault) => {
        return selectedVault ? vaultDisplay(selectedVault) : <></>
      })}
    </>
  )
};

const EditVaultRoute = ({
  router,
}: {
  router: PasswordManagerRouter;
}) => {
  const selectedVaultBind = bind(router, "currentRoute").as((currentRoute) => {
    if (!currentRoute || !("selectedVault" in currentRoute)) {
      return null;
    }
    return currentRoute.selectedVault;
  })

  const resultDisplay = (vault: Vault) => {
    const contentButtons = (
      <>
        {
          vault.content.map((contentItem) => {
            return (
              <button
                className="action-button"
                onClicked={() => {
                  if (contentItem === "otp") {
                    copyVaultOtp(vault)
                  } else {
                    copyVaultSecret(vault, contentItem);
                  }
                }}
                child={
                  <box spacing={8}>
                    <MaterialIcon icon={getContentItemIcon(contentItem)} className="button-icon" />
                    <label label={`Copy ${contentItem}`} />
                  </box>
                }
              />
            )
          })
        }
      </>
    )

    return (
      <box
        className="main-container"
        valign={Gtk.Align.CENTER}
        orientation={Gtk.Orientation.VERTICAL}
        spacing={12}
      >
        <label label={`Vault: ${vault.identifier}`} className="title-label" />
        <box
          spacing={8}
          halign={Gtk.Align.CENTER}
          orientation={Gtk.Orientation.VERTICAL}
        >
          {contentButtons}
          <button
            className="action-button"
            onClicked={() => router.push({ name: "edit-vault", selectedVault: vault })}
            child={
              <box spacing={8}>
                <MaterialIcon icon="edit" className="button-icon" />
                <label label="Edit" />
              </box>
            }
          />
          <button
            className="action-button destructive"
            onClicked={() => router.push({ name: "delete-vault", selectedVault: vault })}
            child={
              <box spacing={8}>
                <MaterialIcon icon="delete" className="button-icon" />
                <label label="Delete" />
              </box>
            }
          />
        </box>
      </box>
    )
  }

  return (
    <>
      {selectedVaultBind.as((selectedVault) => {
        return selectedVault ? resultDisplay(selectedVault) : <></>
      })}
    </>
  )
};

export default ({
  name,
  monitor,
  closeWindow,
  router
}: BaseWindowProps & {
  closeWindow: () => void;
  router?: PasswordManagerRouter;
}) => {
  router = router || new Router<PasswordManagerRoute>({ name: "search" });
  const currentRouteBind = bind(router, "currentRoute");

  const handleKeyPress = (event: Gdk.Event) => {
    const keyval = event.get_keyval()[1];
    if (keyval === Gdk.KEY_Escape) {
      const empty = router.pop();
      if (empty) {
        closeWindow();
      }
      return true;
    }
    return false;
  }

  return (
    <window
      name={name}
      application={App}
      className="password-manager border frosted-glass text-surface text-md rounded-lg"
      monitor={monitor}
      layer={Astal.Layer.OVERLAY}
      exclusivity={Astal.Exclusivity.IGNORE}
      keymode={Astal.Keymode.EXCLUSIVE}
      onKeyPressEvent={(_, event) => {
        return handleKeyPress(event);
      }}
      child={
        <stack
          className="p-lg"
          css="min-width: 550px"
          transitionType={Gtk.StackTransitionType.SLIDE_LEFT_RIGHT}
          transitionDuration={100}
          shown={currentRouteBind.as((currentRoute) => {
            return currentRoute?.name || "search"
          })}
        >
          <box
            name="search"
            halign={Gtk.Align.FILL}
            valign={Gtk.Align.CENTER}
            child={<SearchRoute router={router} />}
          />
          <box
            name="view-vault"
            halign={Gtk.Align.CENTER}
            valign={Gtk.Align.CENTER}
            child={<ViewVaultRoute router={router} closeWindow={closeWindow} />}
          />
          {/* <box */}
          {/*   name="search" */}
          {/*   child={<ViewRoute router={router} />} */}
          {/* /> */}
        </stack>
      }
    />
  ) as Gtk.Window;
}

