<template>
    <highcharts :options="chartOptions" />
</template>
<script>
import axios from 'axios'

export default {
    props: {
        host: {
            type: String,
            default: ''
        },
        dataType: {
            type: String,
            default: ''
        }
    },
    data () {
        return {
            config: {},
            chartOptions: {
                chart: {
                    backgroundColor: {
                        linearGradient: {
                            x1: '100%',
                            x2: 0,
                            y2: '100%'
                        },
                        stops: [
                            [0, '#2e2e4b'],
                            [1, '#323252']
                        ]
                    },
                    borderRadius: 8,
                    resetZoomButton: {
                        theme: {
                            fill: '#678be0',
                            stroke: '#678be0',
                            style: {
                                color: '#fff'
                            },
                            states: {
                                hover: {
                                    fill: '#739dff'
                                }
                            }
                        },
                        relativeTo: 'chart'
                    },
                    spacing: [40, 35, 25, 30],
                    type: 'areaspline',
                    zoomType: 'x'
                },
                credits: {
                    enabled: false
                },
                title: {
                    text: '',
                    style: {
                        color: '#7573a6'
                    }
                },
                xAxis: {
                    crosshair: {
                        color: '#7270a0'
                    },
                    gridLineColor: '#4b497a',
                    gridLineWidth: 1,
                    labels: {
                        style: {
                            color: '#7371a2'
                        }
                    },
                    lineColor: '#4b497a',
                    tickWidth: 0,
                    type: 'datetime'
                },
                yAxis: {
                    gridLineColor: '#4b497a',
                    gridLineWidth: 1,
                    labels: {
                        style: {
                            color: '#7371a2'
                        }
                    },
                    max: 100,
                    tickInterval: 20,
                    title: ''
                },
                plotOptions: {
                    areaspline: {
                        marker: {
                            radius: 1
                        },
                        states: {
                            hover: {
                                lineWidth: 3
                            }
                        },
                        lineWidth: 3,
                        threshold: 0
                    }
                },
                tooltip: {
                    crosshairs: true,
                    shared: true
                },
                series: []
            },
            title: '',
            series: []
        }
    },
    watch: {
        title (newValue) {
            this.chartOptions.title.text = newValue
        },
        series (newValue) {
            this.chartOptions.series = newValue
        }
    },
    mounted: async function () {
        this.config = await this.appConfig()
        let colors = [
            {
                linearGradient: {
                    x1: '50%',
                    y1: '50%',
                    x2: '100%',
                    y2: '0%'
                },
                stops: [
                    [0, '#ea7587'],
                    [0.5, '#e6b888'],
                    [1, '#e6b888']
                ]
            },
            {
                linearGradient: {
                    x1: '50%',
                    y1: '50%',
                    x2: '100%',
                    y2: '0%'
                },
                stops: [
                    [0, '#6362db'],
                    [0.5, '#9e4bdd'],
                    [1, '#9e4bdd']
                ]
            }
        ]

        let fillColor = {
            linearGradient: {
                x1: '50%',
                y1: '100%',
                x2: '50%'
            },
            stops: [
                [0, 'rgba(50, 50, 86, .7)'],
                [0.63, 'rgba(59, 54, 88, .7)']
            ]
        }

        // CPU0
        let host = this.host
        let alias = []
        let query = ''

        if (this.dataType === 'cpu0') {
            this.title = 'CPU0'
            alias = [ 'moon_cpu0_user', 'moon_cpu0_idle' ]
            // eslint-disable-next-line max-len
            query = `SELECT mean("usage_user") AS "${alias[0]}" FROM "cpu" WHERE ("cpu" = 'cpu0' AND "host" = '${host}') AND time >= now() - 6h GROUP BY time(10s) fill(null);SELECT mean("usage_idle") AS "${alias[1]}"  FROM "cpu" WHERE ("cpu" = 'cpu0' AND "host" = '${host}') AND time >= now() - 6h GROUP BY time(10s) fill(null)`
            query = encodeURI(query).replace('=', '%3D').replace(';', '%3B')
        }

        if (this.dataType === 'cpu1') {
            this.title = 'CPU1'
            alias = [ 'moon_cpu1_user', 'moon_cpu1_idle' ]
            // eslint-disable-next-line max-len
            query = `SELECT mean("usage_user") AS "${alias[0]}" FROM "cpu" WHERE ("cpu" = 'cpu1' AND "host" = '${host}') AND time >= now() - 6h GROUP BY time(10s) fill(null);SELECT mean("usage_idle") AS "${alias[1]}"  FROM "cpu" WHERE ("cpu" = 'cpu1' AND "host" = '${host}') AND time >= now() - 6h GROUP BY time(10s) fill(null)`
            query = encodeURI(query).replace('=', '%3D').replace(';', '%3B')
        }

        if (this.dataType === 'memory') {
            alias = 'moon_memory_usage'
            // eslint-disable-next-line max-len
            query = `SELECT mean("used_percent") AS "${alias}" FROM "mem" WHERE ("host" = '${host}') AND time >= now() - 6h GROUP BY time(10s) fill(null)`
            query = encodeURI(query).replace('=', '%3D').replace(';', '%3B')
        }

        let data = await this.fetchData('telegraf', query, 'ms')
        this.series = this.bindDataToChart(data, colors, fillColor)
    },
    methods: {
        fetchData: async function (db, query, epoch) {
            let chartData = []
            try {
                let apiKey = 'eyJrIjoiemJGQzlsY2M5c25VWUk0UWttVTlFQkRrUmR0bUZhN0ciLCJuIjoiZGFwcDIiLCJpZCI6MX0='

                this.chartLoading = true

                // eslint-disable-next-line max-len
                let { data } = await axios.get(`${this.config.grafanaUrl}/api/datasources/proxy/1/query?db=${db}&q=${query}&epoch=${epoch}`, {
                    headers: { Authorization: `Bearer ${apiKey}` }
                })

                this.chartLoading = false
                chartData = data
            } catch (e) {
                this.chartLoading = false
                if (typeof e.response !== 'undefined' && e.response.data.error) {
                    console.log(e.response.data.error)
                } else {
                    console.log(e)
                }
            }

            return chartData
        },
        bindDataToChart: function (data, colors, fillColor) {
            let chartSeries = []
            if (typeof data.results !== 'undefined') {
                let zIndex = 5
                data.results.map((r, idx) => {
                    let series = {}
                    if (r.series.length) {
                        let columns = r.series[0].columns
                        let data = r.series[0].values

                        series.name = typeof columns[1] !== 'undefined' ? columns[1] : ''
                        series.data = data

                        if (typeof colors[idx] !== 'undefined') {
                            series.color = colors[idx]
                        }

                        series.fillColor = fillColor
                        series.zIndex = --zIndex
                    }

                    chartSeries.push(series)
                })
            }

            return chartSeries
        }
    }
}
</script>
