import React, { useCallback, useEffect } from 'react';
import {
    IoTrashBinOutline,
    IoAdd,
} from 'react-icons/io5';
import { GrDrag } from 'react-icons/gr';
import {
    Button,
    TextArea,
    QuickActionButton,
    ControlledExpandableContainer,
    Container,
} from '@the-deep/deep-ui';
import {
    ObjectSchema,
    ArraySchema,
    useForm,
    useFormObject,
    useFormArray,
    createSubmitHandler,
    SetValueArg,
    analyzeErrors,
    Error,
    requiredStringCondition,
    PartialForm,
    getErrorObject,
    defaultUndefinedType,
} from '@togglecorp/toggle-form';
import {
    _cs,
    randomString,
} from '@togglecorp/fujs';

import NonFieldError from '#components/NonFieldError';
import SortableList, { Attributes, Listeners } from '#components/SortableList';
import { reorder } from '#utils/common';

import { Matrix1dWidget } from '#types/newAnalyticalFramework';
import styles from './styles.css';

const ROWS_LIMIT = 20;
const CELLS_LIMIT = 30;

type FormType = Matrix1dWidget;
type PartialFormType = PartialForm<
    FormType,
    'clientId' | 'key' | 'widgetId' | 'order' | 'conditional'
>;

type FormSchema = ObjectSchema<PartialFormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

type DataType = NonNullable<NonNullable<FormType['properties']>>;
export type PartialDataType = PartialForm<DataType, 'key' | 'widgetId' | 'order'>;

type RowType = DataType['rows'][number];
export type PartialRowType = PartialForm<
    RowType,
    'key' | 'widgetId' | 'order'
>;

type CellType = RowType['cells'][number];
export type PartialCellType = PartialForm<
    CellType,
    'key' | 'widgetId' | 'order'
>;

type CellSchema = ObjectSchema<PartialCellType, PartialFormType>;
type CellSchemaFields = ReturnType<CellSchema['fields']>;
const cellSchema: CellSchema = {
    fields: (): CellSchemaFields => ({
        key: [],
        label: [requiredStringCondition],
        tooltip: [],
        order: [],
    }),
};

type CellsSchema = ArraySchema<PartialCellType, PartialFormType>;
type CellsSchemaMember = ReturnType<CellsSchema['member']>;
const cellsSchema: CellsSchema = {
    keySelector: (col) => col.key,
    member: (): CellsSchemaMember => cellSchema,
    validation: (cells) => {
        if ((cells?.length ?? 0) <= 0) {
            return 'At least one cell is required.';
        }
        return undefined;
    },
};

type RowSchema = ObjectSchema<PartialRowType, PartialFormType>;
type RowSchemaFields = ReturnType<RowSchema['fields']>;
const rowSchema: RowSchema = {
    fields: (): RowSchemaFields => ({
        key: [],
        label: [requiredStringCondition],
        tooltip: [],
        color: [],
        cells: cellsSchema,
        order: [],
    }),
};

type RowsSchema = ArraySchema<PartialRowType, PartialFormType>;
type RowsSchemaMember = ReturnType<RowsSchema['member']>;
const rowsSchema: RowsSchema = {
    keySelector: (col) => col.key,
    member: (): RowsSchemaMember => rowSchema,
    validation: (rows) => {
        if ((rows?.length ?? 0) <= 0) {
            return 'At least one row is required.';
        }
        return undefined;
    },
};

type DataSchema = ObjectSchema<PartialDataType, PartialFormType>;
type DataSchemaFields = ReturnType<DataSchema['fields']>;
const dataSchema: DataSchema = {
    fields: (): DataSchemaFields => ({
        rows: rowsSchema,
    }),
};

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [defaultUndefinedType],
        key: [],
        clientId: [],
        title: [requiredStringCondition],
        widgetId: [],
        order: [],
        width: [],

        properties: dataSchema,
        conditional: [],
        version: [],
    }),
};

const defaultCellVal = (): PartialCellType => ({
    key: `auto-${randomString()}`,
    order: -1,
});

const rowKeySelector = (row: PartialRowType) => row.key;
const cellKeySelector = (cell: PartialCellType) => cell.key;

interface CellInputProps {
    className?: string;
    value: PartialCellType;
    error: Error<CellType> | undefined;
    onChange: (value: SetValueArg<PartialCellType>, index: number) => void;
    onRemove: (index: number) => void;
    index: number;
    listeners?: Listeners;
    attributes?: Attributes;
    autoFocus?: boolean;
    expanded: boolean;
    onExpansionChange: (expanded: boolean, key: string) => void;
}

function CellInput(props: CellInputProps) {
    const {
        className,
        value,
        error: riskyError,
        onChange,
        onRemove,
        index,
        listeners,
        attributes,
        autoFocus,
        expanded,
        onExpansionChange,
    } = props;

    const error = getErrorObject(riskyError);

    const onFieldChange = useFormObject(index, onChange, defaultCellVal);

    const errored = analyzeErrors(error);
    const heading = value.label ?? `Cell ${index + 1}`;

    return (
        <ControlledExpandableContainer
            className={className}
            // FIXME: use strings
            heading={`${heading} ${errored ? '*' : ''}`}
            headingSize="extraSmall"
            autoFocus={autoFocus}
            expansionTriggerArea="arrow"
            contentClassName={styles.containerContent}
            withoutBorder
            withoutExternalPadding
            name={value.key}
            expanded={expanded}
            onExpansionChange={onExpansionChange}
            headerIcons={(
                <QuickActionButton
                    name={index}
                    // FIXME: use translation
                    title="Drag"
                    {...attributes}
                    {...listeners}
                >
                    <GrDrag />
                </QuickActionButton>
            )}
            headerActions={(
                <QuickActionButton
                    name={index}
                    onClick={onRemove}
                    // FIXME: use translation
                    title="Remove Cell"
                >
                    <IoTrashBinOutline />
                </QuickActionButton>
            )}
        >
            <NonFieldError error={error} />
            <TextArea
                autoFocus={autoFocus}
                // FIXME: use translation
                label="Label"
                name="label"
                value={value.label}
                onChange={onFieldChange}
                error={error?.label}
            />
            <TextArea
                // FIXME: use translation
                label="Tooltip"
                name="tooltip"
                rows={3}
                value={value.tooltip}
                onChange={onFieldChange}
                error={error?.tooltip}
            />
        </ControlledExpandableContainer>
    );
}

const defaultRowVal = (): PartialRowType => ({
    key: `auto-${randomString()}`,
    order: -1,
});
interface RowInputProps {
    className?: string;
    value: PartialRowType;
    error: Error<RowType> | undefined;
    onChange: (value: SetValueArg<PartialRowType>, index: number) => void;
    onRemove: (index: number) => void;
    index: number;
    listeners?: Listeners;
    attributes?: Attributes;
    autoFocus?: boolean;
    expanded: boolean;
    onExpansionChange: (isExpanded: boolean, rowId: string) => void;
}
function RowInput(props: RowInputProps) {
    const {
        className,
        value,
        error: riskyError,
        onChange,
        onRemove,
        index,
        listeners,
        attributes,
        autoFocus,
        onExpansionChange,
        expanded,
    } = props;

    const error = getErrorObject(riskyError);
    const arrayError = getErrorObject(error?.cells);

    const onFieldChange = useFormObject(index, onChange, defaultRowVal);
    const newlyCreatedOptionIdRef = React.useRef<string | undefined>();

    const {
        setValue: onCellsChange,
        removeValue: onCellsRemove,
    } = useFormArray('cells', onFieldChange);

    const [expandedCellId, setExpandedCellId] = React.useState<string | undefined>();

    const handleAdd = useCallback(
        () => {
            const oldCells = value.cells ?? [];
            // NOTE: Don't let users add more that certain items
            if (oldCells.length >= CELLS_LIMIT) {
                return;
            }

            const cellClientId = randomString();
            newlyCreatedOptionIdRef.current = cellClientId;
            const newCell: PartialCellType = {
                key: cellClientId,
                order: oldCells.length + 1,
            };
            onFieldChange(
                [...oldCells, newCell],
                'cells' as const,
            );
            setExpandedCellId(cellClientId);
        },
        [onFieldChange, value.cells],
    );

    const handleOrderChange = useCallback((
        newValues: PartialCellType[],
    ) => {
        onFieldChange(reorder(newValues), 'cells');
    }, [onFieldChange]);

    const handleExpansionChange = useCallback((cellExpanded: boolean, key: string) => {
        setExpandedCellId(cellExpanded ? key : undefined);
    }, []);

    const cellRendererParams = useCallback((
        key: string,
        cell: PartialCellType,
        cellIndex: number,
    ): CellInputProps => ({
        onChange: onCellsChange,
        onRemove: onCellsRemove,
        error: arrayError?.[key],
        value: cell,
        autoFocus: newlyCreatedOptionIdRef.current === cell.key,
        index: cellIndex,
        expanded: expandedCellId === cell.key,
        onExpansionChange: handleExpansionChange,
    }), [
        onCellsChange,
        onCellsRemove,
        arrayError,
        expandedCellId,
        handleExpansionChange,
    ]);

    const errored = analyzeErrors(error);
    const heading = value.label ?? `Row ${index + 1}`;

    return (
        <ControlledExpandableContainer
            autoFocus={autoFocus}
            className={className}
            expansionTriggerArea="arrow"
            // FIXME: use strings
            heading={`${heading} ${errored ? '*' : ''}`}
            headingSize="extraSmall"
            contentClassName={styles.containerContent}
            withoutExternalPadding
            withoutBorder
            name={value.key}
            expanded={expanded}
            onExpansionChange={onExpansionChange}
            headerIcons={(
                <QuickActionButton
                    name={index}
                    // FIXME: use translation
                    title="Drag"
                    {...attributes}
                    {...listeners}
                >
                    <GrDrag />
                </QuickActionButton>
            )}
            headerActions={(
                <QuickActionButton
                    name={index}
                    onClick={onRemove}
                    // FIXME: use translation
                    title="Remove Row"
                >
                    <IoTrashBinOutline />
                </QuickActionButton>
            )}
        >
            <NonFieldError error={error} />
            <TextArea
                autoFocus={autoFocus}
                // FIXME: use translation
                label="Label"
                name="label"
                value={value.label}
                onChange={onFieldChange}
                error={error?.label}
            />
            <TextArea
                // FIXME: use translation
                label="Tooltip"
                name="tooltip"
                rows={3}
                value={value.tooltip}
                onChange={onFieldChange}
                error={error?.tooltip}
            />
            <Container
                heading="Cells"
                headingSize="extraSmall"
                className={styles.container}
                contentClassName={styles.containerContent}
                withoutExternalPadding
                headerActions={(value.cells?.length ?? 0) < CELLS_LIMIT && (
                    <QuickActionButton
                        name={undefined}
                        onClick={handleAdd}
                        // FIXME: use strings
                        title="Add Cell"
                    >
                        <IoAdd />
                    </QuickActionButton>
                )}
            >
                <NonFieldError error={error?.cells} />
                <SortableList
                    className={styles.sortableList}
                    name="cells"
                    onChange={handleOrderChange}
                    data={value.cells}
                    keySelector={cellKeySelector}
                    renderer={CellInput}
                    direction="vertical"
                    rendererParams={cellRendererParams}
                    showDragOverlay
                    emptyMessage="There are no cells in this row."
                    messageShown
                    messageIconShown
                    compactEmptyMessage
                />
            </Container>
        </ControlledExpandableContainer>
    );
}

const defaultVal: PartialDataType = {};

interface DataInputProps<K extends string>{
    name: K;
    value: PartialDataType | undefined;
    error: Error<PartialDataType> | undefined;
    onChange: (value: SetValueArg<PartialDataType | undefined>, name: K) => void;
    className?: string;
}
function DataInput<K extends string>(props: DataInputProps<K>) {
    const {
        value,
        error: riskyError,
        onChange,
        name,
        className,
    } = props;

    const error = getErrorObject(riskyError);
    const arrayError = getErrorObject(error?.rows);

    const onFieldChange = useFormObject(name, onChange, defaultVal);
    const newlyCreatedOptionIdRef = React.useRef<string | undefined>();
    const [expandedRowId, setExpandedRowId] = React.useState<string | undefined>();

    const {
        setValue: onRowsChange,
        removeValue: onRowsRemove,
    } = useFormArray('rows', onFieldChange);

    const handleAdd = useCallback(
        () => {
            const oldRows = value?.rows ?? [];
            // NOTE: Don't let users add more that certain items
            if (oldRows.length >= ROWS_LIMIT) {
                return;
            }

            const key = randomString();
            newlyCreatedOptionIdRef.current = key;
            const newRow: PartialRowType = {
                key,
                order: oldRows.length + 1,
            };
            onFieldChange(
                [...oldRows, newRow],
                'rows' as const,
            );

            setExpandedRowId(key);
        },
        [onFieldChange, value?.rows],
    );

    const handleOrderChange = useCallback((
        newValues: PartialRowType[],
    ) => {
        onFieldChange(reorder(newValues), 'rows');
    }, [onFieldChange]);

    const handleRowExpansionChange = React.useCallback((expanded: boolean, key: string) => {
        setExpandedRowId(expanded ? key : undefined);
    }, []);

    const rowRendererParams = useCallback((
        key: string,
        row: PartialRowType,
        index: number,
    ): RowInputProps => ({
        onChange: onRowsChange,
        onRemove: onRowsRemove,
        error: arrayError?.[key],
        value: row,
        autoFocus: newlyCreatedOptionIdRef.current === row.key,
        index,
        expanded: expandedRowId === row.key,
        onExpansionChange: handleRowExpansionChange,
    }), [
        onRowsChange,
        onRowsRemove,
        arrayError,
        expandedRowId,
        handleRowExpansionChange,
    ]);

    return (
        <>
            <NonFieldError error={error} />
            <Container
                className={_cs(styles.container, className)}
                // FIXME: Use translation
                heading="Rows"
                headingSize="small"
                contentClassName={styles.containerContent}
                headerActions={(value?.rows?.length ?? 0) < ROWS_LIMIT && (
                    <QuickActionButton
                        name={undefined}
                        onClick={handleAdd}
                        // FIXME: use strings
                        title="Add row"
                    >
                        <IoAdd />
                    </QuickActionButton>
                )}
                withoutExternalPadding
            >
                <NonFieldError error={error?.rows} />
                <SortableList
                    className={styles.sortableList}
                    name="options"
                    onChange={handleOrderChange}
                    data={value?.rows}
                    keySelector={rowKeySelector}
                    renderer={RowInput}
                    direction="vertical"
                    rendererParams={rowRendererParams}
                    showDragOverlay
                    emptyMessage="No rows found."
                    messageShown
                    messageIconShown
                />
            </Container>
        </>
    );
}

interface Matrix1dWidgetFormProps {
    onCancel: () => void;
    onSave: (value: FormType) => void;
    onChange: (value: PartialFormType) => void;
    initialValue: PartialFormType;
    className?: string;
}

function Matrix1dWidgetForm(props: Matrix1dWidgetFormProps) {
    const {
        onChange,
        onSave,
        onCancel,
        initialValue,
        className,
    } = props;

    const {
        pristine,
        value,
        error: riskyError,
        validate,
        setFieldValue,
        setError,
    } = useForm(schema, initialValue);

    const error = getErrorObject(riskyError);

    useEffect(
        () => {
            onChange(value);
        },
        [value, onChange],
    );

    const handleSubmit = useCallback(
        (values: PartialFormType) => {
            onSave(values as FormType);
        },
        [onSave],
    );

    return (
        <form
            className={_cs(styles.matrix1DWidgetForm, className)}
            onSubmit={createSubmitHandler(validate, setError, handleSubmit)}
        >
            <Container
                className={styles.container}
                heading={value.title ?? 'Unnamed'}
                headingDescription="(matrix 1d)"
                spacing="compact"
                headingContainerClassName={styles.headingDescription}
                contentClassName={styles.editorContent}
                withoutExternalPadding
                ellipsizeHeading
                headerActions={(
                    <>
                        <Button
                            name={undefined}
                            onClick={onCancel}
                            variant="tertiary"
                            // FIXME: use strings
                        >
                            Cancel
                        </Button>
                        <Button
                            name={undefined}
                            type="submit"
                            disabled={pristine}
                            // FIXME: use strings
                        >
                            Save
                        </Button>
                    </>
                )}
            >
                <NonFieldError error={error} />
                <TextArea
                    // FIXME: use translation
                    label="Title"
                    name="title"
                    autoFocus
                    value={value.title}
                    onChange={setFieldValue}
                    error={error?.title}
                />
                <DataInput
                    name="properties"
                    value={value.properties}
                    onChange={setFieldValue}
                    error={error?.properties}
                />
            </Container>
        </form>
    );
}

export default Matrix1dWidgetForm;
