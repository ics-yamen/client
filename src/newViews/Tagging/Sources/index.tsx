import React, { useState } from 'react';
import { connect } from 'react-redux';
import {
    Modal,
} from '@the-deep/deep-ui';

import {
    AppState,
} from '#typings';
import { activeProjectIdFromStateSelector } from '#redux';
import { useModalState } from '#hooks/stateManagement';

import Navbar from '../Navbar';
import SourcesStats from './SourcesStats';
import SourcesFilter from './SourcesFilter';
import SourcesTable from './SourcesTable';
import LeadEditModal from './LeadEditModal';
import { FilterFormType as Filters } from './utils';

import styles from './styles.scss';

const mapStateToProps = (state: AppState) => ({
    activeProject: activeProjectIdFromStateSelector(state),
});
interface Props {
    activeProject: number;
}
function Sources(props: Props) {
    const { activeProject } = props;
    const [sourcesFilters, setSourcesFilters] = useState<Filters>();
    const [
        isSingleSourceModalShown,
        showSingleSourceAddModal,
        hideSingleSourceAddModal,
    ] = useModalState(false);

    const [
        isBulkModalShown,
        showBulkUploadModal,
        hideBulkUploadModal,
    ] = useModalState(false);

    return (
        <div className={styles.sources}>
            <Navbar
                onAddSingleSourceClick={showSingleSourceAddModal}
                onBulkUploadClick={showBulkUploadModal}
            />
            <SourcesStats
                className={styles.stats}
                filters={sourcesFilters}
                projectId={activeProject}
            />
            <SourcesFilter
                className={styles.filter}
                onFilterApply={setSourcesFilters}
                projectId={activeProject}
            />
            <SourcesTable
                className={styles.table}
                filters={sourcesFilters}
                projectId={activeProject}
            />
            {isSingleSourceModalShown && (
                <LeadEditModal
                    projectId={activeProject}
                    onClose={hideSingleSourceAddModal}
                    // TODO: Refresh leads after new lead is created
                    onLeadSaveSuccess={hideSingleSourceAddModal}
                />
            )}
            {isBulkModalShown && (
                <Modal
                    onCloseButtonClick={hideBulkUploadModal}
                    // FIXME: Use translation later
                >
                    Bulk upload modal
                </Modal>
            )}
        </div>
    );
}
export default connect(mapStateToProps)(Sources);
