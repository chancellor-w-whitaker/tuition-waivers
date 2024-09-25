import {
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
  PieChart,
  Tooltip,
  Sector,
  Legend,
  XAxis,
  YAxis,
  Label,
  Cell,
  Line,
  Pie,
  Bar,
} from "recharts";
import { AgGridReact } from "ag-grid-react";
import { useState } from "react";

import { useAppContext } from "./context/useAppContext";

const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const {
    innerRadius,
    outerRadius,
    getCellName,
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
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cx={cx}
        cy={cy}
      />
      <Sector
        outerRadius={outerRadius + 10}
        innerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cx={cx}
        cy={cy}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        fill="none"
      />
      <circle stroke="none" fill={fill} cx={ex} cy={ey} r={2} />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        textAnchor={textAnchor}
        fill="#333"
        y={ey}
      >{`${label} ${value}`}</text>
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

const ActiveShapePieChart = ({
  getCellColor,
  getCellName,
  dataKey,
  onClick,
  label,
  data,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (entry, index) => setActiveIndex(index);

  return (
    <ResponsiveContainer height={500}>
      <PieChart>
        <Pie
          activeShape={(props) =>
            renderActiveShape({ ...props, getCellName, label })
          }
          activeIndex={activeIndex}
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
            <Cell fill={getCellColor(entry)} key={`cell-${index}`} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

const BiaxialBarChart = ({ xAxisProps, lineProps, barProps, data }) => {
  return (
    <ResponsiveContainer height={500}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisProps.dataKey} />
        <YAxis stroke={barProps.color} orientation="left" yAxisId="left" />
        <YAxis stroke={lineProps.color} orientation="right" yAxisId="right" />
        <Tooltip />
        <Legend />
        <Bar dataKey={barProps.dataKey} fill={barProps.color} yAxisId="left" />
        <Line
          dataKey={lineProps.dataKey}
          stroke={lineProps.color}
          fill={lineProps.color}
          yAxisId="right"
          strokeWidth={2}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

const CSSGrid = ({ children }) => {
  return (
    <div className="bd-example m-0 border-0 bd-example-cssgrid">
      <div className="grid">
        {children.map((child, index) => (
          <div className="g-col-6" key={index}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function NewApp() {
  const { waiverTypeData, semesterData, programData, studentData } =
    useAppContext();

  return (
    <main className="container">
      <div className="my-3 p-3 bg-body rounded shadow-sm">
        <CSSGrid>
          <div className="ag-theme-balham" style={{ height: 500 }}>
            <AgGridReact {...programData} />
          </div>
          <div className="ag-theme-balham" style={{ height: 500 }}>
            <AgGridReact {...studentData} />
          </div>
          <ActiveShapePieChart {...waiverTypeData}></ActiveShapePieChart>
          <BiaxialBarChart {...semesterData}></BiaxialBarChart>
        </CSSGrid>
      </div>
    </main>
  );
}
