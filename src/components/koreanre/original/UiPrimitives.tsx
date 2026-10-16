// Portfolio-only dependency adapters. The original application uses its shared UI kit.
import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { color?: string; size?: string; shape?: string };
export function Button({color: _color, size: _size, shape: _shape, ...props}: ButtonProps) {
  return <button type="button" {...props} />;
}
export function Chip({variant: _variant, color: _color, ...props}: HTMLAttributes<HTMLSpanElement> & {variant?: string; color?: string}) {
  return <mark {...props} />;
}
