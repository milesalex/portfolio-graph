import React from 'react';
import { GridRows } from '@vx/grid';
import { Group } from '@vx/group';
import { curveBasis } from '@vx/curve';
import { genDateValue, appleStock } from '@vx/mock-data';
import { AxisLeft, AxisBottom, AxisRight } from '@vx/axis';
import { Area, LinePath, Line, Bar } from '@vx/shape';
import { scaleTime, scaleLinear, scaleOrdinal } from '@vx/scale';
import { extent, max, bisector } from 'd3-array';
import { withTooltip, Tooltip, TooltipWithBounds } from '@vx/tooltip';
import { localPoint } from '@vx/event';
import { timeFormat } from 'd3-time-format';
import {
  Legend,
  LegendLinear,
  LegendQuantile,
  LegendOrdinal,
  LegendSize,
  LegendThreshold,
  LegendItem,
  LegendLabel,
  Circle
} from '@vx/legend';

// accessors
const xSelector = d => new Date(d.date);
const ySelector = d => d.close;

const bisectDate = bisector(xSelector).left;
const formatDate = timeFormat('%b %d, %Y');

// responsive utils for axis ticks
function numTicksForHeight(height) {
  if (height <= 300) return 3;
  if (300 < height && height <= 600) return 5;
  return 10;
}

function numTicksForWidth(width) {
  if (width <= 300) return 2;
  if (300 < width && width <= 400) return 5;
  return 10;
}

const ordinalColorScale = scaleOrdinal({
  domain: ['My Portfolio', 'Bitcoin'],
  range: ['magenta', 'blue']
});

class Graph extends React.Component {
  constructor(props) {
    super(props);

    const one = this.newLine(appleStock);
    const two = this.newLine(one);
    this.state = {
      data: appleStock,
      lines: [
        {
          data: appleStock,
          name: 'Apple',
          color: 'green'
        },
        {
          data: one,
          name: 'Bitcoin',
          color: 'magenta'
        },
        {
          data: two,
          name: 'Tesla',
          color: 'blue'
        }
      ],
      circlePositions: [null, null, null]
    };
  }

  getOrdinalScaleFromLines = lines => {
    return scaleOrdinal({
      domain: lines.map(line => line.name),
      range: lines.map(line => line.color)
    });
  };

  newLine = data => {
    return data.map(el => ({
      ...el,
      close: el.close + 100
    }));
  };

  mergeAxisYData = () => {
    let arr = [];
    this.state.lines.forEach(d => {
      const values = d.data.map(value => value.close);
      arr = arr.concat(values);
    });

    return arr;
  };

  handleMouseOver = (event, datum) => {
    const coords = localPoint(event.target.ownerSVGElement, event);
    this.props.showTooltip({
      tooltipLeft: coords.x,
      tooltipTop: coords.y,
      tooltipData: datum
    });
  };

  handleTooltip = ({ event, xSelector, xScale, yScale }) => {
    const { showTooltip } = this.props;
    let dataPoints = [];
    let circlePositions = [];

    for (let i = 0; i < this.state.lines.length; i++) {
      const line = this.state.lines[i];
      const { x } = localPoint(event);
      // console.log(this.props.margin);
      const x0 = xScale.invert(x - this.props.margin.left);
      const index = bisectDate(line.data, x0, 1);

      const d0 = line.data[index - 1];
      const d1 = line.data[index];
      let d = d0;
      if (d1 && d1.date) {
        d = x0 - xSelector(d0) > xSelector(d1) - x0 ? d1 : d0;
      }
      dataPoints.push(d);

      const y = yScale(ySelector(d));
      circlePositions.push(y);
    }

    this.setState({ circlePositions });

    showTooltip({
      tooltipData: dataPoints,
      tooltipLeft: xScale(xSelector(dataPoints[0]))
    });
  };

  formatPrice = price => {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  render() {
    const {
      margin,
      width,
      height,
      tooltipData,
      tooltipLeft,
      tooltipTop,
      tooltipOpen,
      hideTooltip
    } = this.props;

    const { lines } = this.state;

    // bounds
    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;

    // scales
    const xScale = scaleTime({
      range: [0, xMax],
      domain: extent(this.state.data, xSelector)
    });

    const yScale = scaleLinear({
      range: [yMax, 0],
      domain: [0, Math.max(...this.mergeAxisYData(this.state.lines))],
      nice: true
    });

    return (
      <div style={{ backgroundColor: '#fff' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ fontFamily: 'Arial', fontWeight: 400 }}>
              Performance
            </h3>
            <LegendOrdinal
              scale={this.getOrdinalScaleFromLines(this.state.lines)}
              labelFormat={label => `${label}`}
            >
              {labels => {
                return (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      fontFamily: 'Arial',
                      fontSize: 12
                    }}
                  >
                    {labels.map((label, i) => {
                      const size = 8;
                      return (
                        <LegendItem
                          key={`legend-quantile-${i}`}
                          margin={'0 0 0 20px'}
                          onClick={event => {
                            alert(`clicked: ${JSON.stringify(label)}`);
                          }}
                        >
                          <svg width={size} height={size}>
                            <circle
                              fill={label.value}
                              r={size / 2}
                              cx={size / 2}
                              cy={size / 2}
                            />
                          </svg>
                          <LegendLabel align={'left'} margin={'0 0 0 4px'}>
                            {label.text}
                          </LegendLabel>
                        </LegendItem>
                      );
                    })}
                  </div>
                );
              }}
            </LegendOrdinal>
          </div>
        </div>
        <svg width={width} height={height}>
          <GridRows
            top={margin.top}
            left={margin.left}
            scale={yScale}
            width={xMax}
            height={yMax}
            numTicks={numTicksForHeight(height)}
            stroke="#e0e0e0"
          />
          <Group top={margin.top} left={margin.left}>
            {this.state.lines.map((line, i) => (
              <React.Fragment>
                <LinePath
                  data={line.data}
                  x={d => xScale(xSelector(d))}
                  y={d => yScale(ySelector(d))}
                  stroke={
                    this.state.lines.map(item => item.color)[i] || 'magenta'
                  }
                  strokeWidth={1}
                  curve={curveBasis}
                />
                <Bar
                  x={0}
                  y={0}
                  width={width}
                  height={height - margin.bottom}
                  fill="transparent"
                  data={line.data}
                  onMouseMove={event =>
                    this.handleTooltip({
                      data: line.data,
                      event,
                      xSelector,
                      xScale,
                      yScale
                    })
                  }
                  onMouseLeave={event => hideTooltip()}
                />
              </React.Fragment>
            ))}

            {tooltipData && (
              <React.Fragment>
                <g>
                  <Line
                    from={{ x: tooltipLeft, y: 0 }}
                    to={{ x: tooltipLeft, y: yMax }}
                    stroke="#e0e0e0"
                    strokeWidth={1}
                    style={{ pointerEvents: 'none' }}
                    strokeDasharray="0"
                  />
                  {this.state.lines.map((line, i) => {
                    return (
                      <circle
                        key={`dot-${i}`}
                        cx={tooltipLeft}
                        cy={this.state.circlePositions[i]}
                        r={4}
                        fill={this.state.lines[i].color}
                        stroke="white"
                        strokeWidth={2}
                        style={{ pointerEvents: 'none' }}
                      />
                    );
                  })}
                </g>
              </React.Fragment>
            )}
          </Group>
          <Group left={margin.left}>
            <AxisRight
              top={margin.top}
              left={width - margin.right}
              scale={yScale}
              hideZero
              hideAxisLine
              hideTicks
              numTicks={numTicksForHeight(height)}
              stroke="#000"
              tickStroke="#000"
              tickLabelProps={(value, index) => ({
                fill: '#000',
                textAnchor: 'start',
                fontSize: 12,
                fontFamily: 'Arial',
                // dx: '-0.95em',
                dy: '0.25em'
              })}
              tickComponent={({ formattedValue, ...tickProps }) => (
                <text {...tickProps}>${formattedValue}</text>
              )}
            />
            <AxisBottom
              top={height - margin.bottom}
              left={0}
              scale={xScale}
              numTicks={numTicksForWidth(width)}
              hideTicks
              stroke="#e0e0e0"
              tickLabelProps={(value, index) => ({
                fill: '#000',
                textAnchor: 'middle',
                fontSize: 12,
                fontFamily: 'Arial'
              })}
            />
          </Group>
        </svg>
        {tooltipData && (
          <div>
            <TooltipWithBounds
              key={Math.random()}
              top={margin.top + 50}
              left={tooltipLeft + 5}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                color: '#000',
                fontFamily: 'Arial',
                fontSize: '12px',
                border: '1px solid black',
                minWidth: 120,
                padding: '5px 8px'
              }}
            >
              <table style={{ minWidth: 120 }}>
                <tbody>
                  <tr>
                    <th colSpan={2} align="left">
                      {formatDate(new Date(tooltipData[0].date))}
                    </th>
                  </tr>

                  {tooltipData.map((data, i) => {
                    const size = 8;
                    const padding = 4;
                    return (
                      <tr>
                        <td style={{ paddingTop: padding }}>
                          <svg width={size} height={size}>
                            <circle
                              fill={this.state.lines[i].color}
                              r={size / 2}
                              cx={size / 2}
                              cy={size / 2}
                            />
                          </svg>
                          <span style={{ marginLeft: 5 }}>
                            {this.state.lines[i].name}
                          </span>
                        </td>
                        <td
                          style={{ paddingTop: padding, color: 'gray' }}
                          align="left"
                        >
                          {this.formatPrice(data.close)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TooltipWithBounds>
          </div>
        )}
      </div>
    );
  }
}

export default withTooltip(Graph);
