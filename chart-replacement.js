        function renderChart(data) {
            // Destroy existing chart
            if (chartInstance) {
                chartInstance.destroy();
                chartInstance = null;
            }

            if (data.length === 0) {
                return;
            }

            const ctx = elements.chartCanvas.getContext('2d');
            
            // Prepare chart configuration based on metric type
            let config;
            
            if (state.currentMetric === 'blood-pressure') {
                config = {
                    type: 'line',
                    data: {
                        labels: data.map(d => {
                            const date = new Date(d.date);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }),
                        datasets: [
                            {
                                label: 'Systolic',
                                data: data.map(d => d.systolic),
                                borderColor: '#0891b2',
                                backgroundColor: 'rgba(8, 145, 178, 0.1)',
                                tension: 0.1,
                                pointRadius: 4,
                                pointHoverRadius: 6
                            },
                            {
                                label: 'Diastolic',
                                data: data.map(d => d.diastolic),
                                borderColor: '#0e7490',
                                backgroundColor: 'rgba(14, 116, 144, 0.1)',
                                tension: 0.1,
                                pointRadius: 4,
                                pointHoverRadius: 6
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: false,
                                grid: {
                                    color: '#e2e8f0'
                                },
                                ticks: {
                                    color: '#6b7280',
                                    font: {
                                        size: 12
                                    }
                                }
                            },
                            x: {
                                grid: {
                                    color: '#e2e8f0'
                                },
                                ticks: {
                                    color: '#6b7280',
                                    font: {
                                        size: 12
                                    }
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                    color: '#374151',
                                    font: {
                                        size: 12
                                    }
                                }
                            }
                        }
                    }
                };
            } else {
                // Single metric chart (weight or waist)
                const color = state.currentMetric === 'weight' ? '#0891b2' : '#059669';
                let yAxisConfig = {};
                
                if (state.currentMetric === 'weight') {
                    yAxisConfig = {
                        min: 200,
                        max: 220,
                        ticks: {
                            stepSize: 5
                        }
                    };
                }
                
                config = {
                    type: 'line',
                    data: {
                        labels: data.map(d => {
                            const date = new Date(d.date);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }),
                        datasets: [{
                            label: state.currentMetric === 'weight' ? 'Weight (lbs)' : 'Waist (inches)',
                            data: data.map(d => d.value),
                            borderColor: color,
                            backgroundColor: color + '20',
                            tension: 0.1,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            fill: false
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                ...yAxisConfig,
                                grid: {
                                    color: '#e2e8f0'
                                },
                                ticks: {
                                    color: '#6b7280',
                                    font: {
                                        size: 12
                                    }
                                }
                            },
                            x: {
                                grid: {
                                    color: '#e2e8f0'
                                },
                                ticks: {
                                    color: '#6b7280',
                                    font: {
                                        size: 12
                                    }
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                };
            }

            chartInstance = new Chart(ctx, config);
        }