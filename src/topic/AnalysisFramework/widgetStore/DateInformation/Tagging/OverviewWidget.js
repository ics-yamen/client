import CSSModules from 'react-css-modules';
import React from 'react';
import PropTypes from 'prop-types';

import {
    DateInput,
} from '../../../../../public/components/Input';

import styles from './styles.scss';

const propTypes = {
    id: PropTypes.number.isRequired,
    api: PropTypes.object.isRequired,      // eslint-disable-line
    attribute: PropTypes.object,      // eslint-disable-line
};

const defaultProps = {
    attribute: undefined,
};

@CSSModules(styles)
export default class DateInformationOverview extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    handleChange = (value) => {
        const { api, id } = this.props;
        api.setEntryAttribute(id, {
            value,
        });
    }

    render() {
        const {
            attribute,
        } = this.props;

        return (
            <div styleName="date-overview">
                <DateInput
                    onChange={this.handleChange}
                    value={attribute && attribute.value}
                />
            </div>
        );
    }
}