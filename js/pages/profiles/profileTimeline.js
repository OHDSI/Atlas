define(function(require, exports) {
  const moment = require('moment')
  const _ = require('lodash')
  const d3 = require('d3')
  const { schemeCategory10 } = require('d3-scale-chromatic')
  const icons = {
    open:
      'M11.9994 1.72559L1.16058 13.1063C0.894011 13.3862 0.466495 13.3862 0.199926 13.1063C-0.0666428 12.8264 -0.0666428 12.3775 0.199926 12.0976L11.5216 0.209923C11.7881 -0.0699738 12.2156 -0.0699738 12.4822 0.209924L23.7988 12.0976C23.9296 12.2349 24 12.4198 24 12.5993C24 12.7789 23.9346 12.9637 23.7988 13.101C23.5322 13.3809 23.1047 13.3809 22.8382 13.101L11.9994 1.72559Z',
    close:
      'M12.0006 11.5906L22.8394 0.20984C23.106 -0.0700579 23.5335 -0.0700579 23.8001 0.20984C24.0666 0.489738 24.0666 0.938628 23.8001 1.21852L12.4784 13.1062C12.2119 13.3861 11.7844 13.3861 11.5178 13.1062L0.201183 1.21852C0.0704137 1.08122 1.48104e-07 0.896379 1.50246e-07 0.716822C1.52387e-07 0.537265 0.0653841 0.352427 0.201183 0.215119C0.467753 -0.0647777 0.895268 -0.0647776 1.16184 0.215119L12.0006 11.5906Z',
    pinned:
      'M52.963,21.297c-0.068-0.329-0.297-0.603-0.609-0.727c-2.752-1.097-5.67-1.653-8.673-1.653  c-4.681,0-8.293,1.338-9.688,1.942L19.114,8.2c0.52-4.568-1.944-7.692-2.054-7.828C16.881,0.151,16.618,0.016,16.335,0  c-0.282-0.006-0.561,0.091-0.761,0.292L0.32,15.546c-0.202,0.201-0.308,0.479-0.291,0.765c0.016,0.284,0.153,0.549,0.376,0.726  c2.181,1.73,4.843,2.094,6.691,2.094c0.412,0,0.764-0.019,1.033-0.04l12.722,14.954c-0.868,2.23-3.52,10.27-0.307,18.337  c0.124,0.313,0.397,0.541,0.727,0.609c0.067,0.014,0.135,0.021,0.202,0.021c0.263,0,0.518-0.104,0.707-0.293l14.57-14.57  l13.57,13.57c0.195,0.195,0.451,0.293,0.707,0.293s0.512-0.098,0.707-0.293c0.391-0.391,0.391-1.023,0-1.414l-13.57-13.57  l14.527-14.528C52.929,21.969,53.031,21.627,52.963,21.297z',
  }
  class Timeline {
    constructor(chartContainer) {
      // chart variables
      this.chartContainer = chartContainer

      this.svg

      this.brush

      this.brushed

      this.xDayScale

      this.r = 5

      this.fontSize = 12

      this.domainFontSize = 16

      this.ySpace = 35

      // label space
      this.lineStrokeWidth = 3

      this.truncateLength = 20

      this.margin = {
        top: 30,
        right: 60,
        bottom: 30,
        left: 200,
      }
      this.width =
        document.getElementById(this.chartContainer).offsetWidth -
        this.margin.left -
        this.margin.right

      this.height = 1000

      this.lineStroke = '#CDCDCD'

      this.circleFill = '#CDCDCD'

      this.expandAllColor = '#467AB2'

      this.textFill = 'black'

      this.unPinnednedFill = '#8D8D8D'

      this.pinnedFill = '#467AB2'

      this.filteredData = []
      this.filterText = ''
      this.axisType = ''
      this.allData = []
      this.originalData = []
      //
      this.updateData = this.updateData.bind(this)
      this.init()
    }

    init() {
      d3.select(`#${this.chartContainer}`)
        .append('div')
        .attr('class', 'profileTimeline')

      this.implementColorScheme()
      this.implementFilter()
      this.implementAxisSelection()
      this.implementExpandingAll()
      this.implementTooltip()
      this.implementColorPicker()

      this.svg = d3
        .select(`#${this.chartContainer} .profileTimeline`)
        .append('svg')
        .append('g')
        .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
        .attr('class', 'timelineChart')

      this.svg
        .append('defs')
        .append('svg:clipPath')
        .attr('id', 'clip')
        .append('svg:rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('x', -this.r)
        .attr('y', -this.r)
      // create day xAxis
      this.svg.append('g').attr('class', 'dayAxis')
      // create date xAxis
      this.svg.append('g').attr('class', 'dateAxis hidden-axis')

      // dayAxis Scale
      this.xDayScale = d3.scaleLinear().range([0, this.width])
      // dateAxis Scale
      this.xDateScale = d3.scaleTime().range([0, this.width])
      // create brush
      this.brush = this.svg.append('g').attr('class', 'brush')
      // hide color picker if click outsite

      d3.select(`#${this.chartContainer} .profileTimeline`).on('click', () => {
        const tagName = d3.event.target.tagName.toLowerCase()
        const clickOnCircle = typeof tagName == 'string' && tagName == 'circle'
        const colorPicker = d3
          .select(`#${this.chartContainer}`)
          .select(`.colorPicker`)

        if (!clickOnCircle) {
          colorPicker
            .transition()
            .duration(400)
            .style('opacity', 0)
            .style('z-index', -1)
        }
      })

      window.addEventListener(
        'resize',
        _.throttle(() => {
          this.width =
            document.getElementById(this.chartContainer).offsetWidth -
            this.margin.left -
            this.margin.right
          this.updateScale()
          this.drawTimeline(this.originalData)
        }, 200)
      )
    }

    updateData(rawData) {
      this.allData.splice(
        0,
        this.allData.length,
        ...this.transformedData(rawData)
      )
      const newOriginalData = this.transformedData(rawData).filter(
        timeline => !timeline.belongTo
      )
      this.originalData.splice(0, this.originalData.length, ...newOriginalData)
      this.maxMoment = d3.max(
        this.allData
          .map(el => el.observationData)
          .flat()
          .map(el => el.endDay)
      )

      this.minMoment = d3.min(
        this.allData
          .map(el => el.observationData)
          .flat()
          .map(el => el.startDay)
      )

      this.maxDate = d3.max(
        this.allData
          .map(el => el.observationData)
          .flat()
          .map(el => el.endDate)
      )

      this.minDate = d3.min(
        this.allData
          .map(el => el.observationData)
          .flat()
          .map(el => el.startDate)
      )
      this.updateScale()
      this.drawTimeline(this.originalData)
    }

    updateScale() {
      // dayAxis Scale
      this.xDayScale = d3.scaleLinear().range([0, this.width])
      // dateAxis Scale
      this.xDateScale = d3.scaleTime().range([0, this.width])
      this.xDayScale.domain([this.minMoment, this.maxMoment])
      // dateAxis Scale
      this.xDateScale.domain([this.minDate, this.maxDate])

      this.svg
        .select(`#${this.chartContainer} .dayAxis`)
        .call(d3.axisBottom(this.xDayScale))
      this.svg
        .select(`#${this.chartContainer} .dateAxis`)
        .call(d3.axisBottom(this.xDateScale))
    }

    implementColorScheme() {
      this.colorScheme = d3
        .scaleOrdinal()
        .domain(this.allData.filter(el => !el.belongTo).map(el => el.id))
        .range(schemeCategory10)
    }

    implementFilter() {
      const input = d3
        .select(`#${this.chartContainer} .profileTimeline`)
        .append('div')
        .style('text-align', 'left')
        .attr('class', 'timelineFilter')
        .append('div')
        .style('width', '168px')
        .append('input')
        .attr('placeholder', 'Filter timeline')
        .attr('class', 'form-control input-sm')
      d3.select(`#${this.chartContainer} .timelineFilter`).style(
        'padding',
        `${this.margin.top / 2}px 0 0 ${this.margin.left}px`
      )
      input.on('input', _.debounce(() => this.handleFilter(), 200))
    }

    handleFilter() {
      this.filteredData.splice(0, this.filteredData.length)
      const inputVal = d3
        .select(`#${this.chartContainer} .timelineFilter`)
        .select('input')
        .node()
        .value.trim()

      this.filterText = inputVal

      if (inputVal === '') {
        this.handleCollapseAll()
      } else {
        const filteredData = this.allData.filter(
          el =>
            el.belongTo &&
            el.label.toLowerCase().includes(inputVal.toLowerCase())
        )
        if (filteredData.length === 0) {
          this.filterText = ''
          this.handleCollapseAll()
          return
        }
        this.handleExpandingAll()
      }
    }

    implementAxisSelection() {
      const container = d3
        .select(`#${this.chartContainer} .timelineFilter`)
        .append('div')
        .style('text-align', 'right')
        .style('margin-right', `${this.margin.right / 2}px`)

      container
        .append('text')
        .text('Effective date: ')
        .attr(
          'title',
          'Turn effective date on to see the events’ effective date instead of the index day.'
        )
      const switcher = container.append('label').attr('class', 'switch')
      const checkbox = switcher.append('input').attr('type', 'checkbox')
      switcher.append('span').attr('class', 'slider round')

      checkbox.on('change', () => this.changeAxisView())
    }

    changeAxisView() {
      const selected = d3.select(`#${this.chartContainer} .switch>input`).node()
        .checked
      this.axisType = selected ? 'Date' : 'Day'
      this.svg.select('.dayAxis').classed('hidden-axis', selected)
      this.svg.select('.dateAxis').classed('hidden-axis', !selected)
    }

    implementExpandingAll() {
      const div = d3
        .select(`#${this.chartContainer} .profileTimeline`)
        .append('div')
        .attr('class', 'expandingButton')
        .style('text-align', 'left')
        .style('color', this.expandAllColor)
        .style('padding', `${this.margin.top / 3}px 0 0 ${this.margin.left}px`)

      const expandText = div
        .append('button')
        .attr('class', 'btn btn-primary btn-sm')
        .text('Expand all')
        .style('font-size', `${this.fontSize}px`)
        .style('margin-right', `10px`)

      const collapseAll = div
        .append('button')
        .attr('class', 'btn btn-default btn-sm')
        .text('Collapse all')
        .style('font-size', `${this.fontSize}px`)

      expandText.on('click', () => this.handleExpandingAll())
      collapseAll.on('click', () => this.handleCollapseAll())
    }

    handleExpandingAll() {
      let expandedData
      if (this.filterText) {
        expandedData = this.allData
          .filter(
            el =>
              !el.belongTo ||
              el.isPinned ||
              (el.belongTo &&
                el.label.toLowerCase().includes(this.filterText.toLowerCase()))
          )
          .map(el => {
            if (!el.belongTo && !el.expanded) return { ...el, expanded: true }
            return el
          })
      } else {
        expandedData = this.allData.map(el => {
          if (!el.belongTo) return { ...el, expanded: true }
          return el
        })
      }
      this.originalData.splice(0, this.originalData.length, ...expandedData)

      this.drawTimeline(this.originalData)
      this.allExpanded = true
    }

    handleCollapseAll() {
      _.remove(this.originalData, el => el.belongTo && !el.isPinned)
      // change domain expanded state
      for (let i = 0; i < this.originalData.length; i += 1) {
        if (!this.originalData[i].belongTo) {
          this.originalData[i].expanded = false
        }
      }
      this.drawTimeline(this.originalData)
    }

    implementTooltip() {
      d3.select(`#${this.chartContainer} .profileTimeline`)
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
    }

    implementColorPicker() {
      const container = d3
        .select(`#${this.chartContainer} .profileTimeline`)
        .append('div')
        .attr('class', 'colorPicker selected-color')
        .style('opacity', 0)
        .style('z-index', -1)

      const palette = [
        '#1f78b4',
        '#33a02c',
        '#e31a1c',
        '#ff7f00',
        '#6a3d9a',
        '#b15928',
      ]

      const iconColors = [
        '#a6cee3',
        '#b2df8a',
        '#fb9a99',
        '#fdbf6f',
        '#cab2d6',
        '#ff9',
      ]
      const colorButtons = container
        .selectAll('button')
        .data(palette)
        .enter()
        .append('button')

      colorButtons
        .attr('title', 'Set selected events color')
        .attr('class', 'btn selected-color')
        .attr(
          'style',
          (d, i) => `background: ${d}; borderColor: ${iconColors[i]}`
        )

      colorButtons
        .append('span')
        .attr('class', 'fa fa-paint-brush selected-color')
        .attr('style', (d, i) => `color: ${iconColors[i]}`)

      this.colorButtons = colorButtons
    }

    expandDomain(domain) {
      let expandedData
      if (this.filterText) {
        expandedData = this.allData
          .filter(el => el.belongTo === domain.label)
          .filter(
            el =>
              el.isPinned ||
              (el.belongTo &&
                el.label.toLowerCase().includes(this.filterText.toLowerCase()))
          )
      } else {
        expandedData = this.allData.filter(el => el.belongTo === domain.label)
      }
      const domainIndex = this.originalData.findIndex(
        el => el.label === domain.label
      )
      this.originalData[domainIndex].expanded = true
      // calculate length of current expanding concepts
      const domainConceptsLength = this.originalData.filter(
        el => el.belongTo === domain.label
      ).length
      this.originalData.splice(
        domainIndex + 1,
        domainConceptsLength,
        ...expandedData
      )
      this.drawTimeline(this.originalData)
    }

    closeDomain(domain) {
      const domainIndex = this.originalData.findIndex(
        el => el.label === domain.label
      )
      this.originalData[domainIndex].expanded = false
      const closingLength = this.originalData.filter(
        el => el.belongTo === domain.label
      ).length
      const existingElement = this.originalData.filter(
        el => el.belongTo === domain.label && el.isPinned
      )
      // _.remove(this.originalData, el => el.belongTo === domain.label && !el.isPinned);
      this.originalData.splice(
        domainIndex + 1,
        closingLength,
        ...existingElement
      )
      this.drawTimeline(this.originalData)
    }

    resetBrush() {
      this.svg.select('.brush').call(this.brushed.move, null)
      this.xDayScale.domain([this.minMoment, this.maxMoment])
      this.xDateScale.domain([this.minDate, this.maxDate])

      this.svg
        .select(`#${this.chartContainer} .dayAxis`)
        .call(d3.axisBottom(this.xDayScale))
      this.svg
        .select(`#${this.chartContainer} .dateAxis`)
        .call(d3.axisBottom(this.xDateScale))
      // update circles
      this.svg.selectAll('circle').attr('cx', d => this.xDayScale(d.startDay))

      // update lines
      this.svg
        .selectAll('.observationLine')
        .attr('x1', d => this.xDayScale(d.startDay))
        .attr('x2', d => this.xDayScale(d.endDay))
    }

    makeBrush() {
      // to handle reset brush
      let idleTimeout
      function idled() {
        idleTimeout = null
      }
      // (re)apply brush
      this.brushed = d3
        .brushX()
        .extent([[0, -this.r], [this.width, this.height]])
        .on('end', () => {
          const extent = d3.event.selection
          if (!extent) {
            if (!idleTimeout) {
              // This allows to wait a little bit
              idleTimeout = setTimeout(idled, 350)
              return
            }
            this.xDayScale.domain([this.minMoment, this.maxMoment])
            this.xDateScale.domain([this.minDate, this.maxDate])
          } else {
            const extentDay0 = this.xDayScale.invert(extent[0])
            const extentDay1 = this.xDayScale.invert(extent[1])

            const extentDate0 = this.xDateScale.invert(extent[0])
            const extentDate1 = this.xDateScale.invert(extent[1])

            this.xDayScale.domain([extentDay0, extentDay1])
            this.xDateScale.domain([extentDate0, extentDate1])
            this.svg.select('.brush').call(this.brushed.move, null)
          }
          // update axis
          this.svg.select('.dayAxis').call(d3.axisBottom(this.xDayScale))
          this.svg.select('.dateAxis').call(d3.axisBottom(this.xDateScale))
          // update circles
          this.svg
            .selectAll('circle')
            .attr('cx', d => this.xDayScale(d.startDay))

          // update lines
          this.svg
            .selectAll('.observationLine')
            .attr('x1', d => this.xDayScale(d.startDay))
            .attr('x2', d => this.xDayScale(d.endDay))
        })

      this.brush.call(this.brushed)
    }

    drawTimeline(chartData) {
      // reset brushed if exists
      if (this.brushed) {
        this.resetBrush()
      }
      // (re)calculate height and width
      this.height = chartData.length * this.ySpace

      // re-assign height and width
      d3.select(`#${this.chartContainer} svg`)
        .attr('width', this.width + this.margin.left + this.margin.right)
        .attr('height', this.height + this.margin.top + this.margin.bottom)

      // (re)calculate axis

      this.svg
        .select('.dayAxis')
        .attr('transform', `translate(0,${this.height})`)
      this.svg
        .select('.dateAxis')
        .attr('transform', `translate(0,${this.height})`)

      // (re)calculate clip path
      this.svg
        .select(`#${this.chartContainer}  rect`)
        .attr('width', this.width + this.r * 2)
        .attr('height', this.height)

      this.makeBrush()

      let timelineParent = this.svg
        .selectAll('.timelineParent')
        .data(chartData, d =>
          d.belongTo ? d.label + d.belongTo + d.isPinned : d.label + d.expanded
        )

      // remove a timeline
      // if not remove timelineChildren, they are still in memory even after being deleted
      timelineParent
        .exit()
        .select('.labelContainers')
        .remove()

      timelineParent
        .exit()
        .select('.timelineChildren')
        .remove()

      timelineParent.exit().remove()

      const timelineParentEnter = timelineParent
        .enter()
        .append('g')
        .attr('class', 'timelineParent')
        .attr('transform', (d, i) => `translate(${0},${i * 2})`)

      const labelContainers = timelineParentEnter
        .append('g')
        .attr('class', 'labelContainers')
      // append timelineChildren to newly added timelinesParent
      timelineParentEnter.append('g').attr('class', 'timelineChildren')

      labelContainers
        .attr(
          'transform',
          (d, i) =>
            `translate(${
              d.belongTo
                ? -this.margin.left + this.truncateLength + 20
                : -this.margin.left + this.truncateLength
            },${this.fontSize / 3})`
        )
        .on('click', (d, i) => {
          if (d.belongTo) {
            this.pinLabel({ ...d, isPinned: !d.isPinned })
          } else if (!d.belongTo && !d.expanded) {
            this.expandDomain(d)
          } else if (!d.belongTo && d.expanded) {
            this.closeDomain(d)
          }
        })

      labelContainers
        .append('title')
        .text(d => (d.belongTo ? 'Pin important events in the timeline' : ''))

      labelContainers.append('path').attr('class', 'icon')

      labelContainers
        .append('text')
        .attr('class', 'label')
        .attr(
          'style',
          d => `font-size: ${!d.belongTo ? this.domainFontSize : this.fontSize}`
        )
        .attr('fill', this.textFill)
        .style('text-anchor', 'start')
        .attr('x', 10)

      // merge back to the timelineParent
      timelineParent = timelineParentEnter.merge(timelineParent)
      // update other timeline
      timelineParent
        .attr('transform', (d, i) => `translate(${0},${i * this.ySpace})`)
        .style('alignment-baseline', 'middle')

      timelineParent
        .select('g.labelContainers')
        .select('text.label')
        .text(d => {
          const label = _.truncate(d.label, { length: this.truncateLength })
          return label
        })
        .attr('fill', this.textFill)

      const iconPath = timelineParent
        .select('g.labelContainers')
        .select('path.icon')
      iconPath
        .attr('d', d => {
          if (d.belongTo) {
            return icons.pinned
          }
          return d.expanded ? icons.open : icons.close
        })
        .attr('fill', d => {
          if (d.belongTo) {
            return d.isPinned ? this.pinnedFill : 'white'
          } else {
            return this.textFill
          }
        })
        .attr('stroke', d => {
          if (d.belongTo) {
            return this.unPinnednedFill
          }
        })
        .attr('transform', d => {
          if (d.belongTo) {
            return 'scale(0.25) rotate(90) translate(-45,-40)'
          } else {
            return 'scale(0.5) translate(-10,-15)'
          }
        })

      // draw circles and lines
      const timelineChildren = timelineParent.select('.timelineChildren')
      timelineChildren.attr('clip-path', 'url(#clip)')

      // draw lines
      const lines = timelineChildren.selectAll('line').data(
        d => {
          const observationData = d.observationData.filter(
            el => el.endDay !== el.startDay
          )
          return observationData.map(el => ({
            ...el,
            selectedColor: d.selectedColor,
          }))
        },
        d => d.startDay + d.endDay + d.conceptId + d.selectedColor
      )

      lines.exit().remove()

      lines
        .enter()
        .append('line')
        .attr('class', 'observationLine')
        .attr('x1', d => this.xDayScale(d.startDay))
        .attr('x2', d => this.xDayScale(d.endDay))
        .attr('stroke', d => {
          if (d.inDomainLine) {
            return ` ${this.circleFill}`
          } else {
            if (d.selectedColor) {
              return `${d.selectedColor}`
            } else {
              return `${this.colorScheme(d.conceptId)}`
            }
          }
        })
        .attr('stroke-width', this.lineStrokeWidth)

      // cicles
      const circles = timelineChildren.selectAll('circle').data(
        d => {
          const observationData = d.observationData
          return observationData.map(el => ({
            ...el,
            selectedColor: d.selectedColor,
          }))
        },
        d => d.startDay + d.endDay + d.conceptId + d.selectedColor
      )
      circles.exit().remove()

      circles
        .enter()
        .append('circle')
        .attr('cx', d => {
          return this.xDayScale(d.startDay)
        })
        .attr('style', d => {
          if (d.inDomainLine) {
            return `fill: ${this.circleFill}`
          } else {
            if (d.selectedColor) {
              return `fill: ${d.selectedColor}`
            } else {
              return `fill: ${this.colorScheme(d.conceptId)}`
            }
          }
        })
        .attr('r', this.r)
        .attr('width', 100)
        .attr('height', 100)
        .on('mouseover', d => {
          // display tooltip
          const singleTimelineData = chartData.filter(el =>
            d.inDomainLine
              ? el.label === d.domain
              : el.label === d.conceptName && d.domain === el.belongTo
          )[0]
          this.showTooltip(singleTimelineData, d)
        })
        .on('mouseout', () => {
          this.hideTooltip()
        })
        .on('click', d => {
          if (d.inDomainLine) return
          // return click event if any
          this.colorButtons.on('click', null)
          this.selectColor(d)
        })
    }

    pinLabel(d) {
      const originalDataIndex = this.originalData.findIndex(
        el => el.id === d.id && d.belongTo === el.belongTo
      )
      const allDataIndex = this.allData.findIndex(
        el => el.id === d.id && el.belongTo === d.belongTo
      )
      this.allData[allDataIndex].isPinned = d.isPinned
      this.originalData[originalDataIndex].isPinned = d.isPinned
      this.drawTimeline(this.originalData)
    }

    showTooltip(timeLineData, d, content) {
      const tooltip = d3.select(`#${this.chartContainer} .tooltip`)
      let tooltipContent
      if (!content) {
        tooltipContent = this.getTooltipContent(timeLineData.observationData, d)
      } else {
        tooltipContent = `<div>${content}</div>`
      }
      tooltip
        .transition()
        .duration(100)
        .style('opacity', 1)

      tooltip.html(tooltipContent)

      const tooltipSize = tooltip.node().getBoundingClientRect()
      var coordinates = d3.mouse(this.svg.node())
      tooltip.style(
        'left',
        coordinates[0] + this.margin.left - tooltipSize.width + 'px'
      )
      tooltip.style('top', coordinates[1] + this.margin.top + 'px')
    }

    hideTooltip() {
      const tooltip = d3.select(`#${this.chartContainer} .tooltip`)
      tooltip
        .transition()
        .duration(0)
        .style('opacity', 0)
    }

    getTooltipContent(timelineObservationData, dataPoint) {
      const tooltipContentList = []
      timelineObservationData
        .filter(point => point.startDay === dataPoint.startDay)
        .forEach(point => {
          const pointIndex = tooltipContentList.findIndex(
            p =>
              p.startDay === point.startDay &&
              p.endDay === point.endDay &&
              p.conceptId === point.conceptId
          )
          if (pointIndex > -1) {
            tooltipContentList[pointIndex].frequency += 1
          } else {
            tooltipContentList.push({ ...point, frequency: 1 })
          }
        })
      let tooltipContent = ''
      tooltipContentList.forEach(content => {
        const startTime =
          this.axisType === 'Date'
            ? moment(content.startDate).format('MM-DD-YYYY')
            : content.startDay
        const endTime =
          this.axisType === 'Date'
            ? moment(content.endDate).format('MM-DD-YYYY')
            : content.endDay
        const startEndDifferent = content.startDay !== content.endDay
        tooltipContent += `<div style="margin-bottom:5px">
              <strong>${content.conceptId}</strong> <br />
              <span>${content.conceptName}</span> <br />
              <span>Start: ${startTime} ${
          startEndDifferent ? `- End: ${endTime}` : ''
        }
            </span>, 
              <span>Frequency: ${content.frequency} </span>
            </div>`
      })

      return tooltipContent
    }

    transformedData(data) {
      const sortedData = data.sort((a, b) => {
        if (a.domain < b.domain) {
          return -1
        }
        if (a.domain > b.domain) {
          return 1
        }
        return 0
      })
      const tData = _.transform(
        sortedData,
        // eslint-disable-next-line no-unused-vars
        (accumulator, item, index, originalArr) => {
          const { conceptId, conceptName, domain } = item
          const { endDay, startDay } = item
          const startDate =
            item.startDate || new Date(moment(new Date()).add(startDay, 'days'))
          const endDate =
            item.startDate || new Date(moment(new Date()).add(endDay, 'days'))
          const observationData = {
            endDay,
            startDay,
            endDate,
            startDate,
            conceptId,
            conceptName,
            domain,
            selectedColor: null,
          }

          const timeLineDomain = {
            label: domain,
            id: domain,
            observationData: [{ ...observationData, inDomainLine: true }],
            belongTo: null,
            expanded: false,
            hidden: false,
            isPinned: false,
          }

          const timeLine = {
            label: conceptName,
            id: conceptId,
            isPinned: false,
            hidden: false,
            expanded: false,
            observationData: [{ ...observationData }],
            belongTo: domain,
            selectedColor: null,
          }

          // push timeline for domain
          const timeLineDomainIndex = accumulator.findIndex(
            el => el.id === domain
          )
          if (timeLineDomainIndex > -1) {
            accumulator[timeLineDomainIndex].observationData.push({
              ...observationData,
              inDomainLine: true,
            })
          } else {
            accumulator.push(timeLineDomain)
          }

          // push timeline for concept
          const timeLineIndex = accumulator.findIndex(
            el => el.id === conceptId && el.belongTo === domain
          )

          if (timeLineIndex > -1) {
            accumulator[timeLineIndex].observationData.push(observationData)
          } else {
            accumulator.push(timeLine)
          }
        },
        []
      )
      return tData
    }

    selectColor(d) {
      const colorPicker = d3.select(`#${this.chartContainer} .colorPicker`)
      const colorPickerSize = colorPicker.node().getBoundingClientRect()
      var coordinates = d3.mouse(this.svg.node())

      colorPicker.style(
        'left',
        coordinates[0] + this.margin.left - colorPickerSize.width / 2 + 'px'
      )
      colorPicker.style(
        'top',
        coordinates[1] + this.margin.top + colorPickerSize.height * 1.5 + 'px'
      )

      colorPicker
        .transition()
        .duration(400)
        .style('opacity', 1)
        .style('z-index', 10)

      this.colorButtons.on('click', color => {
        colorPicker
          .transition()
          .duration(400)
          .style('opacity', 0)
          .style('z-index', -1)
        this.fillColor(d, color)
        //remove event listener after click
        //if not removed, each time click on circle, this will be invoked 1 more time -> not good
        this.colorButtons.on('click', null)
      })
    }

    fillColor(d, selectedColor) {
      const originalDataIndex = this.originalData.findIndex(
        el => el.belongTo === d.domain && d.conceptId === el.id
      )
      const allDataIndex = this.allData.findIndex(
        el => el.belongTo === d.domain && d.conceptId === el.id
      )
      this.allData[allDataIndex].selectedColor = selectedColor
      this.originalData[originalDataIndex].selectedColor = selectedColor
      this.drawTimeline(this.originalData)
    }

    remove() {
      this.originalData = null
      this.allData = null
      this.filterText = ''
      this.svg.selectAll('*').remove()
      d3.select(`#${this.chartContainer}`)
        .selectAll('*')
        .remove()
    }
    removeInput() {
      document.querySelector(
        `#${this.chartContainer} .switch>input`
      ).checked = false
      this.changeAxisView()

      document.querySelector(
        `#${this.chartContainer} .timelineFilter input`
      ).value = ''
      this.filteredData.splice(0, this.filteredData.length)
      this.filterText = null
    }
  }

  return Timeline
})
