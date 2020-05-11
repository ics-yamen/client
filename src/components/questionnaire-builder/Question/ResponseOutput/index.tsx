import React from 'react';
import { _cs } from '@togglecorp/fujs';

import ListView from '#rsu/../v2/View/ListView';
import { KeyValueElement } from '#typings';
import { isChoicedQuestionType } from '#entities/questionnaire';

import styles from './styles.scss';

interface ResponseOptionsProps {
    className?: string;
    value: KeyValueElement;
}

const ResponseOption = ({
    className,
    value,
}: ResponseOptionsProps) => (
    <div className={_cs(styles.responseOption, className)}>
        { value.value }
    </div>
);

interface Props {
    className?: string;
    value: KeyValueElement[];
    itemClassName?: string;
    type: string;
}

const responseOptionKeySelector = (d: KeyValueElement) => d.key;

class ResponseOutput extends React.PureComponent<Props> {
    public static defaultProps = {
        value: [],
    }

    getResponseOptionRendererParams = (
        key: KeyValueElement['key'],
        value: KeyValueElement,
    ) => ({
        className: this.props.itemClassName,
        value,
    })

    public render() {
        const {
            className,
            value,
            type,
        } = this.props;

        if (!type || !isChoicedQuestionType(type)) {
            return null;
        }

        return (
            <ListView
                data={value}
                className={_cs(styles.responseOutput, className)}
                keySelector={responseOptionKeySelector}
                renderer={ResponseOption}
                rendererParams={this.getResponseOptionRendererParams}
            />
        );
    }
}

export default ResponseOutput;