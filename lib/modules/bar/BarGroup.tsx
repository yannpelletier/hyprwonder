import type { BoxProps } from "astal/gtk3/widget";

export default ({ className, ...restProps }: BoxProps) => {
  return (
    <box
      className={`rounded-lg px-md py-sm bg-background ${className}`}
      css="min-height: 28px;"
      {...restProps}
    />
  )
}
