const tabularSchema = [];

{
    const name = 'TabularBookSchema';
    const schema = {
        doc: { name: 'TabularBook' },
        extends: 'dbentity',
        fields: {
            file: { type: 'uint', required: true },
            fileType: { type: 'string', required: true },
            metaStatus: { type: 'string' },
            status: { type: 'string', required: true },
            // Make this required later
            project: { type: 'uint' },
            title: { type: 'string', required: true },

            // FIXME: write schema for options
            options: { type: 'object' },
            meta: { type: 'object' },

            sheets: { arrayType: 'TabularSheetSchema', required: true },
        },
    };
    tabularSchema.push({ name, schema });
}
{
    const name = 'TabularSheetSchema';
    const schema = {
        doc: { name: 'TabularSheet' },
        fields: {
            data: {
                required: true,
                type: {
                    doc: { name: 'Data' },
                    fields: {
                        columns: {
                            required: true,
                            type: {
                                doc: { name: 'CellMap' },
                                fields: {
                                    '*': {
                                        required: true,
                                        arrayType: {
                                            doc: { name: 'Cell' },
                                            fields: {
                                                value: { type: 'unknown' },
                                                processedValue: { type: 'unknown' },
                                                invalid: { type: 'boolean' },
                                                empty: { type: 'boolean' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            fields: {
                required: true,
                arrayType: {
                    doc: { name: 'Fields' },
                    fields: {
                        hidden: { type: 'boolean' },
                        id: { type: 'uint', required: true },
                        options: { type: 'object', required: true },
                        ordering: { type: 'uint', required: true },
                        title: { type: 'string', required: true },
                        type: { type: 'string', required: true },
                    },
                },
            },
            title: { type: 'string', required: true },
            id: { type: 'uint', required: true },
            // FIXME: write schema for options
            options: { type: 'object' },
            hidden: { type: 'boolean' },
        },
    };
    tabularSchema.push({ name, schema });
}

export default tabularSchema;
