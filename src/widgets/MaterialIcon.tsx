import { Accessor, CCProps } from "ags";
import { Gtk } from "ags/gtk4";

export default function MaterialIcon(
  { icon, css: cssProp, ...restProps }: { icon: string | Accessor<string>; } & Partial<Omit<CCProps<Gtk.Label, Gtk.Label.ConstructorProps>, "label">>
) {
  const css = `font-family: "Material Icons", "Material Symbols Rounded"; ${cssProp || ''}`;
  return (
    <overlay>
      <label css={css} label={icon} {...restProps} />
    </overlay>
  )
}
