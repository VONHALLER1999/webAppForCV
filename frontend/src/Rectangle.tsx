import React from "react";
import { useSpring, animated } from "@react-spring/web";

type RectangleProps = {
  width: number;
  height: number;
  x: number;
  y: number;
  fill?: string;
};

const AnimatedRect = animated("rect") as unknown as React.FC<
  React.SVGProps<SVGRectElement> & {
    x: string | number;
    y: string | number;
    width: string | number;
    height: string | number;
  }
>;

export const Rectangle = (props: RectangleProps) => {
  const { x, y, width, height, fill = "#9d174d" } = props;
  const springProps = useSpring({
    to: { x, y, width, height },
    from: { x, y: y + height, width, height: 0 },
    config: { friction: 30 },
    delay: x,
  });
  

  return (
    <AnimatedRect
      x={springProps.x as unknown as number}
      y={springProps.y as unknown as number}
      width={springProps.width as unknown as number}
      height={springProps.height as unknown as number}
      opacity={0.7}
      stroke={fill}
      fill={fill}
      fillOpacity={0.3}
      strokeWidth={1}
      rx={1}
    />
  );
};

export default Rectangle;
