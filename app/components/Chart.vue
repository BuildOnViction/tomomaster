<template>
    <highcharts
        :options="chartOptions"
        class="chart" />
</template>
<script>
// import Highcharts from 'highcharts'
export default {
    data () {
        return {
            chartOptions: {
                chart: {
                    type: 'areaspline',
                    zoomType: 'x',
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
                    spacing: [40, 35, 25, 35]
                },
                credits: {
                    enabled: false
                },
                title: {
                    text: ''
                },
                xAxis: {
                    crosshair: {
                        color: '#7270a0'
                    },
                    gridLineColor: '#4b497a',
                    gridLineWidth: 1,
                    gridZIndex: 3,
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
                    gridLineWidth: 0,
                    labels: {
                        style: {
                            color: '#7371a2'
                        }
                    },
                    max: 100,
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
                legend: {
                    style: {
                        color: 'red'
                    }
                },
                series: [
                    {
                        data: [91, 95, 97, 92, 90, 79, 56, 64, 98, 70, 68, 56, 75, 88, 83],
                        pointStart: Date.UTC(2018, 1, 1),
                        pointInterval: 1000 * 3600 * 24,
                        color: {
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
                        },
                        fillColor: {
                            linearGradient: {
                                x1: '50%',
                                y1: '100%',
                                x2: '50%'
                            },
                            stops: [
                                [0, '#323256'],
                                [0.63, '#3b3658']
                            ]
                        }
                    }// ,
                    // {
                    //     data: [9, 5, 3, 8, 10, 21, 44, 36, 2, 30, 32, 44, 25, 12, 47],
                    //     pointStart: Date.UTC(2018, 1, 1),
                    //     pointInterval: 1000 * 3600 * 24,
                    //     color: {
                    //         linearGradient: {
                    //             x1: '50%',
                    //             y1: '50%',
                    //             x2: '100%',
                    //             y2: '0%'
                    //         },
                    //         stops: [
                    //             [0, '#6362db'],
                    //             [0.5, '#9e4bdd'],
                    //             [1, '#9e4bdd']
                    //         ]
                    //     },
                    //     fillColor: {
                    //         linearGradient: {
                    //             x1: '50%',
                    //             y1: '100%',
                    //             x2: '50%'
                    //         },
                    //         stops: [
                    //             [0, '#323256'],
                    //             [0.63, '#3b3658']
                    //         ]
                    //     }
                    // }
                ]
            }
        }
    }
}
</script>
