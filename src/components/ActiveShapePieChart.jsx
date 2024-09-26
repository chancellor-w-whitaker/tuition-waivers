import { ResponsiveContainer, PieChart, Sector, Cell, Pie } from "recharts";
import { useState } from "react";

const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const {
    innerRadius,
    outerRadius,
    getCellName,
    fillOpacity,
    startAngle,
    midAngle,
    endAngle,
    payload,
    percent,
    label,
    value,
    fill,
    cx,
    cy,
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <text textAnchor="middle" fill={fill} x={cx} y={cy} dy={8}>
        {getCellName(payload)}
      </text>
      <Sector
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        fillOpacity={fillOpacity}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cx={cx}
        cy={cy}
      />
      <Sector
        outerRadius={outerRadius + 10}
        innerRadius={outerRadius + 6}
        fillOpacity={fillOpacity}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cx={cx}
        cy={cy}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        strokeOpacity={fillOpacity}
        stroke={fill}
        fill="none"
      />
      <circle
        fillOpacity={fillOpacity}
        stroke="none"
        fill={fill}
        cx={ex}
        cy={ey}
        r={2}
      />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        textAnchor={textAnchor}
        fill="#333"
        y={ey}
      >{`${label} : ${value}`}</text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        textAnchor={textAnchor}
        fill="#999"
        dy={18}
        y={ey}
      >
        {`(Rate ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

export const ActiveShapePieChart = ({
  handleActiveCell,
  getCellColor,
  getCellName,
  dataKey,
  onClick,
  label,
  data,
}) => {
  const [activeCellName, setActiveCellName] = useState();

  const [previousData, setPreviousData] = useState(data);

  if (previousData !== data) {
    // if activeCellName goes missing, pick a different one

    setPreviousData(data);

    if (previousData.length === 0 && data.length > 0) {
      setActiveCellName(getCellName(data[0]));
    }
  }

  const onPieEnter = (entry) => setActiveCellName(getCellName(entry));

  return (
    <ResponsiveContainer height={500}>
      <PieChart>
        <Pie
          activeIndex={data.findIndex(
            (entry) => getCellName(entry) === activeCellName
          )}
          activeShape={(props) =>
            renderActiveShape({ ...props, getCellName, label })
          }
          onMouseEnter={onPieEnter}
          onClick={onClick}
          dataKey={dataKey}
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          data={data}
          cx="50%"
          cy="50%"
        >
          {data.map((entry, index) => (
            <Cell
              {...handleActiveCell(entry)}
              fill={getCellColor(entry)}
              key={`cell-${index}`}
            />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};
