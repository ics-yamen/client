import PropTypes from 'prop-types';
import React from 'react';

import LoadingAnimation from '#rscv/LoadingAnimation';
import Button from '#rsca/Button';

import TriggerAndPoll from '#components/TriggerAndPoll';
import { iconNames } from '#constants';

import EditField from '../EditField';

import styles from './styles.scss';


const getSortIcon = sortOrder => ({
    asc: iconNames.sortAscending,
    dsc: iconNames.sortDescending,
})[sortOrder] || iconNames.sort;

const shouldExtractGeo = ({ type, geodata }) => (
    type === 'geo' &&
    (!geodata || geodata.status === 'pending')
);
const isValidGeo = ({ type, geodata }) => (
    type === 'geo' &&
    (geodata && geodata.status === 'success')
);

export default class Header extends React.PureComponent {
    static propTypes = {
        columnKey: PropTypes.string.isRequired,
        value: PropTypes.shape({}).isRequired,
        onSortClick: PropTypes.func.isRequired,
        sortOrder: PropTypes.string,
        onChange: PropTypes.func.isRequired,
    };

    static defaultProps = {
        sortOrder: undefined,
    };

    handleSortClick = () => {
        this.props.onSortClick(this.props.columnKey);
    }

    handleChange = (value) => {
        this.props.onChange(this.props.columnKey, value);
    }

    handleGeoData = (value) => {
        this.props.onChange(this.props.columnKey, value);
    }

    renderGeoPending = () => {
        const { value } = this.props;

        if (!shouldExtractGeo(value)) {
            return null;
        }

        const { id } = value;
        return (
            <TriggerAndPoll
                compareValue={value}
                url={`/tabular-fields/${id}/`}
                triggerUrl={`/tabular-geo-extraction-trigger/${id}/`}
                shouldTrigger={shouldExtractGeo}
                shouldPoll={shouldExtractGeo}
                isValid={isValidGeo}
                onDataReceived={this.handleGeoData}
            >
                {({ invalid }) => (!invalid && (
                    <span className={styles.loadingContainer}>
                        <LoadingAnimation />
                    </span>
                ))}
            </TriggerAndPoll>
        );
    }

    render() {
        const {
            sortOrder,
            value,
        } = this.props;

        return (
            <div className={styles.header}>
                <Button
                    className={styles.title}
                    onClick={this.handleSortClick}
                    iconName={getSortIcon(sortOrder)}
                    transparent
                >
                    {value.title}
                </Button>
                {this.renderGeoPending()}
                <EditField
                    className={styles.edit}
                    onChange={this.handleChange}
                    iconName={iconNames.edit}
                    value={value}
                    transparent
                />
            </div>
        );
    }
}

