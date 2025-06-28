import { LabelProps } from "astal/gtk3/widget";

import type { Binding } from "astal";

export default function MaterialIcon(
  { icon, css: cssProp, ...restProps }: Omit<{ icon: string | Binding<string> } & LabelProps, "label">
) {
  const css = `font-family: "Material Icons", "Material Symbols Rounded"; ${cssProp || ''}`;
  return (
    <overlay
      passThrough={true}
      child={<label css={css} label={icon} {...restProps} />}
    />
  )
}
