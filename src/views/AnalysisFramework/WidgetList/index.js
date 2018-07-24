import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ListView from '#rs/components/View/List/ListView';
import { randomString } from '#rs/utils/common';
import { addAfViewWidgetAction } from '#redux';

import { fetchWidget } from '../widgets';

import WidgetPreview from './WidgetPreview';
import styles from './styles.scss';

const propTypes = {
    widgets: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    className: PropTypes.string,
    analysisFrameworkId: PropTypes.number.isRequired,
    widgetType: PropTypes.string.isRequired,

    addWidget: PropTypes.func.isRequired,
};
const defaultProps = {
    className: '',
    widgets: [],
};

const mapDispatchToProps = dispatch => ({
    addWidget: params => dispatch(addAfViewWidgetAction(params)),
});

@connect(undefined, mapDispatchToProps)
export default class WidgetList extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    static keyExtractor = widget => widget.widgetId;

    handleItemAdd = (widget) => {
        const {
            widgetId,
            title,
        } = widget;
        const {
            analysisFrameworkId,
            widgetType,
        } = this.props;

        const overviewWidget = fetchWidget('overview', widgetId);
        const listWidget = fetchWidget('list', widgetId);

        // TODO: calculate new position appropriately
        const widgetInfo = {
            key: `${widgetType}-${widgetId}-${randomString(16)}`,
            widgetId,
            title,
            properties: {
                overviewGridLayout: overviewWidget && {
                    left: 0,
                    top: 0,
                    ...overviewWidget.minSize,
                },
                listGridLayout: listWidget && {
                    left: 0,
                    top: 0,
                    ...listWidget.minSize,
                },
            },
        };

        this.props.addWidget({
            analysisFrameworkId,
            widget: widgetInfo,
        });
    }

    rendererParams = (key, widget) => ({
        widget,
        onAdd: this.handleItemAdd,
    })

    render() {
        return (
            <ListView
                className={`${styles.widgetList} ${this.props.className}`}
                data={this.props.widgets}
                renderer={WidgetPreview}
                keyExtractor={WidgetList.keyExtractor}
                rendererParams={this.rendererParams}
            />
        );
    }
}