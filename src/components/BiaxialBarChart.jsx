import {
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  Cell,
  Line,
  Bar,
} from "recharts";

export const BiaxialBarChart = ({
  handleActiveCell,
  formatDataKeys,
  valueFormatter,
  xAxisProps,
  lineProps,
  barProps,
  data,
}) => {
  const createLeftYAxisLabel = (props) => ({
    value: formatDataKeys(props.dataKey),
    style: { textAnchor: "middle" },
    fill: props.color,
    position: "left",
    angle: -90,
    offset: 0,
  });

  const createRightYAxisLabel = (props) => ({
    value: formatDataKeys(props.dataKey),
    style: { textAnchor: "middle" },
    fill: props.color,
    position: "right",
    angle: -90,
    offset: 0,
  });

  return (
    <ResponsiveContainer height={500}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisProps.dataKey} />
        <YAxis
          label={createLeftYAxisLabel(barProps)}
          tickFormatter={barProps.tickFormatter}
          stroke={barProps.color}
          orientation="left"
          yAxisId="left"
        />
        <YAxis
          label={createRightYAxisLabel(lineProps)}
          tickFormatter={lineProps.tickFormatter}
          stroke={lineProps.color}
          orientation="right"
          yAxisId="right"
        />
        <Tooltip
          formatter={(value, name) => [
            valueFormatter(value),
            formatDataKeys(name),
          ]}
        />
        <Legend formatter={formatDataKeys} />
        <Bar
          onClick={barProps.onClick}
          dataKey={barProps.dataKey}
          fill={barProps.color}
          yAxisId="left"
        >
          {data.map((entry, index) => (
            <Cell {...handleActiveCell(entry)} key={`cell-${index}`} />
          ))}
        </Bar>
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
