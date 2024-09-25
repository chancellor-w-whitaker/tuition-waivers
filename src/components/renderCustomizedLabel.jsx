import { radian } from "../constants/radian";

export const renderCustomizedLabel = ({
  innerRadius,
  outerRadius,
  midAngle,
  percent,
  cx,
  cy,
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * radian);
  const y = cy + radius * Math.sin(-midAngle * radian);

  return (
    <text
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fill="white"
      x={x}
      y={y}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};
