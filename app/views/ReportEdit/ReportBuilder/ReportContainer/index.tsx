import React, { useMemo, useCallback } from 'react';
import {
    type EntriesAsList,
    useFormObject,
    useFormArray,
} from '@togglecorp/toggle-form';
import {
    _cs,
    sum,
    isDefined,
    randomString,
    compareNumber,
} from '@togglecorp/fujs';
import {
    Message,
    Kraken,
    Button,
    QuickActionButton,
} from '@the-deep/deep-ui';
import { IoAdd } from 'react-icons/io5';

import { reorder } from '#utils/common';
import { useModalState } from '#hooks/stateManagement';
import {
    AnalysisReportContainerContentConfigurationType,
    AnalysisReportContainerContentTypeEnum,
} from '#generated/types';

import {
    type PartialFormType,
    type ReportContainerType,
} from '../../schema';

import ContentAddModal from './ContentAddModal';
import Content from './Content';

import styles from './styles.css';

interface Props {
    className?: string;
    containerKey?: string;
    row?: number;
    column?: number;
    width?: number;
    index: number;
    allItems: ReportContainerType[] | undefined;
    contentType: AnalysisReportContainerContentTypeEnum | undefined;
    configuration: AnalysisReportContainerContentConfigurationType | undefined;
    setFieldValue: (...entries: EntriesAsList<PartialFormType>) => void;
}

function ReportContainer(props: Props) {
    const {
        className,
        containerKey,
        contentType,
        row = 1,
        column = 1,
        width = 1,
        index,
        allItems,
        configuration,
        setFieldValue,
    } = props;
    console.log('here', contentType);

    const {
        setValue: onReportContainerChange,
    } = useFormArray(
        'containers',
        setFieldValue,
    );

    const onFieldChange = useFormObject(
        index,
        onReportContainerChange,
        () => ({
            row,
            column: column + 1,
            width: 1,
            clientId: randomString(),
        }),
    );

    const [
        contentAddModalVisible,
        showContentAddModal,
        hideContentAddModal,
    ] = useModalState(false);

    const rowItems = useMemo(() => {
        const items = allItems?.filter((item) => item.row === row);
        const newItems = [...(items ?? [])];
        newItems.sort((a, b) => compareNumber(a.column, b.column));
        return newItems;
    }, [
        allItems,
        row,
    ]);

    const indexInCurrentRow = useMemo(() => (
        rowItems.findIndex((item) => item.column === column)
    ), [rowItems, column]);

    const totalColSpan = useMemo(() => (
        sum(rowItems.map((item) => item.width).filter(isDefined))
    ), [rowItems]);

    const disableAddButtons = totalColSpan >= 12;

    const handleAddBeforeClick = useCallback(() => {
        const newRowItems = [...rowItems];
        const newItem = {
            row,
            column,
            clientId: randomString(),
            width: 12 - totalColSpan,
        };
        newRowItems.splice(indexInCurrentRow, 0, newItem);
        const orderedItems = reorder(newRowItems, 'column');

        setFieldValue((oldVal: ReportContainerType[] | undefined = []) => {
            const newVal = oldVal.filter((item) => item.row !== row);
            return [
                ...newVal,
                ...orderedItems,
            ];
        }, 'containers');
    }, [
        setFieldValue,
        indexInCurrentRow,
        row,
        totalColSpan,
        rowItems,
        column,
    ]);

    const handleAddAfterClick = useCallback(() => {
        const newRowItems = [...rowItems];
        const newItem = {
            row,
            column: column + 1,
            clientId: randomString(),
            width: 12 - totalColSpan,
        };
        newRowItems.splice(indexInCurrentRow + 1, 0, newItem);
        const orderedItems = reorder(newRowItems, 'column');

        setFieldValue((oldVal: ReportContainerType[] | undefined = []) => {
            const newVal = oldVal.filter((item) => item.row !== row);
            return [
                ...newVal,
                ...orderedItems,
            ];
        }, 'containers');
    }, [
        setFieldValue,
        indexInCurrentRow,
        row,
        totalColSpan,
        rowItems,
        column,
    ]);

    const handleAddAboveClick = useCallback(() => {
        setFieldValue((oldVal: ReportContainerType[] | undefined = []) => {
            const newItems = [...oldVal];
            const newItem = {
                row,
                column: 1,
                clientId: randomString(),
                width: 6,
            };
            const indexOfCurrentRow = oldVal.findIndex((item) => item.row === row);
            newItems.splice(indexOfCurrentRow, 0, newItem);
            return newItems.map((item) => ({
                ...item,
                row: ((item.row ?? 0) >= newItem.row && item.clientId !== newItem.clientId)
                    ? ((item.row ?? 0) + 1)
                    : item.row,
            }));
        }, 'containers');
    }, [
        setFieldValue,
        row,
    ]);

    const handleAddBelowClick = useCallback(() => {
        setFieldValue((oldVal: ReportContainerType[] | undefined = []) => {
            const newItems = [...oldVal];
            const newItem = {
                row: row + 1,
                column: 1,
                clientId: randomString(),
                width: 6,
            };
            const indexOfRowAfter = oldVal.findIndex((item) => item.row === row + 1);
            newItems.splice(indexOfRowAfter, 0, newItem);
            return newItems.map((item) => ({
                ...item,
                row: ((item.row ?? 0) >= newItem.row && item.clientId !== newItem.clientId)
                    ? ((item.row ?? 0) + 1)
                    : item.row,
            }));
        }, 'containers');
    }, [
        setFieldValue,
        row,
    ]);

    const handleContentAddClick = useCallback((
        newContentType: AnalysisReportContainerContentTypeEnum,
    ) => {
        hideContentAddModal();
        onFieldChange(newContentType, 'contentType');
    }, [
        onFieldChange,
        hideContentAddModal,
    ]);

    return (
        <div
            className={_cs(className, styles.reportContainer)}
            style={{
                gridRow: row,
                gridColumn: `span ${width}`,
            }}
        >
            <QuickActionButton
                className={_cs(styles.beforeButton, styles.addButton)}
                name={undefined}
                onClick={handleAddBeforeClick}
                disabled={disableAddButtons}
                variant="secondary"
                spacing="compact"
            >
                <IoAdd />
            </QuickActionButton>
            <QuickActionButton
                className={_cs(styles.afterButton, styles.addButton)}
                name={undefined}
                onClick={handleAddAfterClick}
                disabled={disableAddButtons}
                variant="secondary"
                spacing="compact"
            >
                <IoAdd />
            </QuickActionButton>
            <QuickActionButton
                className={_cs(styles.aboveButton, styles.addButton)}
                name={undefined}
                onClick={handleAddAboveClick}
                variant="secondary"
                spacing="compact"
            >
                <IoAdd />
            </QuickActionButton>
            <QuickActionButton
                className={_cs(styles.belowButton, styles.addButton)}
                name={undefined}
                onClick={handleAddBelowClick}
                variant="secondary"
                spacing="compact"
            >
                <IoAdd />
            </QuickActionButton>
            {!contentType && (
                <Message
                    className={styles.message}
                    message="No content yet."
                    icon={(
                        <Kraken
                            variant="sleep"
                            size="extraSmall"
                        />
                    )}
                    actions={(
                        <Button
                            name={undefined}
                            onClick={showContentAddModal}
                            variant="tertiary"
                            spacing="compact"
                        >
                            Add content
                        </Button>
                    )}
                />
            )}
            {contentType && (
                <Content
                    contentType={contentType}
                    configuration={configuration}
                />
            )}
            {contentAddModalVisible && (
                <ContentAddModal
                    onCloseButtonClick={hideContentAddModal}
                    onSelect={handleContentAddClick}
                />
            )}
        </div>
    );
}

export default ReportContainer;
