import React from "react";
import { useSpring, animated } from "@react-spring/web";

type RectangleProps = {
  width: number;
  height: number;
  x: number;
  y: number;
};

export const Rectangle = (props: RectangleProps) => {
  const { x, y, width, height } = props;

  const springProps = useSpring({
    to: { x, y, width, height },
    config: { friction: 30 },
    delay: x,
  });

  // Cast animated.rect to a component that accepts x, y, width, and height as either a number or a spring value.
  const AnimatedRect = animated.rect as React.FC<
    React.SVGProps<SVGRectElement> & {
      x: number | typeof springProps.x;
      y: number | typeof springProps.y;
      width: number | typeof springProps.width;
      height: number | typeof springProps.height;
    }
  >;

  return (
    <AnimatedRect
      x={springProps.x as any}
      y={springProps.y as any}
      width={springProps.width as any}
      height={springProps.height as any}
      opacity={0.7}
      stroke="#9d174d"
      fill="#9d174d"
      fillOpacity={0.3}
      strokeWidth={1}
      rx={1}
    />
  );
};
