import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ListView from '#rscv/List/ListView';

import {
    editEntriesEntriesSelector,
    editEntriesWidgetsSelector,
} from '#redux';

import { entryAccessor } from '#entities/editEntriesBetter';

import { hasWidget } from '../widgets';
import WidgetFaramContainer from './WidgetFaramContainer';
import styles from './styles.scss';

const propTypes = {
    entries: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    widgets: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    pending: PropTypes.bool,
};

const defaultProps = {
    entries: [],
    widgets: [],
    pending: false,
};

const mapStateToProps = state => ({
    entries: editEntriesEntriesSelector(state),
    widgets: editEntriesWidgetsSelector(state),
});

// eslint-disable-next-line react/no-multi-comp
@connect(mapStateToProps)
export default class Listing extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    static widgetType = 'list'

    static filterWidgets = widgets => widgets.filter(
        widget => hasWidget(Listing.widgetType, widget.widgetId),
    );

    constructor(props) {
        super(props);
        this.widgets = Listing.filterWidgets(props.widgets);
    }

    componentDidMount() {
        window.addEventListener('scroll', this.handleScroll, true);
    }

    componentWillReceiveProps(nextProps) {
        const { widgets: oldWidgets } = this.props;
        const { widgets: newWidgets } = nextProps;
        if (newWidgets !== oldWidgets) {
            this.widgets = Listing.filterWidgets(newWidgets);
        }
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleScroll, true);
    }

    keySelector = entry => entryAccessor.key(entry)

    handleScroll = (e) => {
        console.warn(e);
    }

    rendererParams = (key, entry) => {
        const {
            entries, // eslint-disable-line
            ...otherProps
        } = this.props;
        return {
            entry,
            widgetType: Listing.widgetType,
            ...otherProps,
        };
    }

    render() {
        const { entries } = this.props;

        return (
            <ListView
                className={styles.list}
                data={entries}
                renderer={WidgetFaramContainer}
                rendererParams={this.rendererParams}
                rendererClassName={styles.widgetContainer}
                keyExtractor={this.keySelector}
            />
        );
    }
}
