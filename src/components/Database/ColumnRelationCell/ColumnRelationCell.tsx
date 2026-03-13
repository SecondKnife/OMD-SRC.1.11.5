/*
 *  Copyright 2024 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { Modal, Tag, Tooltip, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NO_DATA_PLACEHOLDER } from '../../../constants/constants';
import { CustomRoutes } from '../../../enums/CustomRoutes';
import { ColumnJoins } from '../../../generated/entity/data/table';
import {
  ColumnRelation,
  deleteColumnRelation,
} from '../../../rest/customAPI';

export interface LineageColumnEntry {
  fqn: string;
  function?: string;
}

interface ColumnRelationCellProps {
  tableFqn: string;
  columnName: string;
  canEdit: boolean;
  relations: ColumnRelation[];
  joins: ColumnJoins[];
  lineageColumns: LineageColumnEntry[];
  onRelationChange: () => void;
}

const ColumnRelationCell = ({
  tableFqn,
  columnName,
  canEdit,
  relations,
  joins,
  lineageColumns,
  onRelationChange,
}: ColumnRelationCellProps) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);

  const filteredRelations = useMemo(
    () => relations.filter((r) => r.source_column_name === columnName),
    [relations, columnName]
  );

  const filteredJoins = useMemo(() => {
    const colJoin = joins.find((j) => j.columnName === columnName);

    return colJoin?.joinedWith ?? [];
  }, [joins, columnName]);

  const hasAnyData =
    filteredRelations.length > 0 ||
    filteredJoins.length > 0 ||
    lineageColumns.length > 0;

  const iframeSrc = useMemo(() => {
    const params = new URLSearchParams({
      sourceFqn: tableFqn,
      sourceColumn: columnName,
    });

    return `${CustomRoutes.COLUMN_RELATION_PICKER}?${params.toString()}`;
  }, [tableFqn, columnName]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteColumnRelation(id);
        onRelationChange();
      } catch {
        // Error handled silently; the API layer can log details
      }
    },
    [onRelationChange]
  );

  const handleOpenModal = useCallback(() => {
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  useEffect(() => {
    if (!modalVisible) {
      return;
    }

    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'column-relation-saved') {
        onRelationChange();
        setModalVisible(false);
      }
    };

    window.addEventListener('message', handler);

    return () => window.removeEventListener('message', handler);
  }, [modalVisible, onRelationChange]);

  const shortFqn = (fqn: string) => {
    const parts = fqn.split('.');

    return parts.length >= 2
      ? `${parts[parts.length - 2]}.${parts[parts.length - 1]}`
      : fqn;
  };

  return (
    <div className="d-flex flex-wrap gap-2 items-center">
      {lineageColumns.map((lc) => (
        <Tooltip
          key={`lineage-${lc.fqn}`}
          title={`Lineage: ${lc.fqn}${lc.function ? ` (${lc.function})` : ''}`}>
          <Tag color="purple">
            <Typography.Text
              className="text-xs"
              ellipsis={{ tooltip: false }}
              style={{ maxWidth: 140 }}>
              {shortFqn(lc.fqn)}
            </Typography.Text>
          </Tag>
        </Tooltip>
      ))}

      {/* OMD native joins — read-only, blue tags */}
      {filteredJoins.map((jw) => {
        const shortName = jw.fullyQualifiedName.split('.').slice(-2).join('.');

        return (
          <Tooltip key={`join-${jw.fullyQualifiedName}`} title={jw.fullyQualifiedName}>
            <Tag color="blue">
              <Typography.Text
                className="text-xs"
                ellipsis={{ tooltip: false }}
                style={{ maxWidth: 140 }}>
                {shortName}
              </Typography.Text>
            </Tag>
          </Tooltip>
        );
      })}

      {/* Custom relations — editable, green tags */}
      {filteredRelations.map((rel) => (
        <Tooltip
          key={rel.id}
          title={`${rel.target_table_fqn}.${rel.target_column_name}`}>
          <Tag
            color="green"
            closable={canEdit}
            onClose={(e) => {
              e.preventDefault();
              handleDelete(rel.id);
            }}>
            <Typography.Text
              className="text-xs"
              ellipsis={{ tooltip: false }}
              style={{ maxWidth: 140 }}>
              {rel.target_table_fqn.split('.').pop()}.
              {rel.target_column_name}
            </Typography.Text>
          </Tag>
        </Tooltip>
      ))}

      {!hasAnyData && (
        <Typography.Text className="text-grey-muted text-xs">
          {NO_DATA_PLACEHOLDER}
        </Typography.Text>
      )}

      {canEdit && (
        <Tag
          className="cursor-pointer"
          data-testid="add-column-relation"
          onClick={handleOpenModal}>
          + {t('label.add')}
        </Tag>
      )}

      <Modal
        destroyOnClose
        footer={null}
        open={modalVisible}
        title={t('label.column-relation')}
        width={640}
        onCancel={handleCloseModal}>
        <iframe
          src={iframeSrc}
          style={{
            width: '100%',
            height: '400px',
            border: 'none',
          }}
          title="Column Relation Picker"
        />
      </Modal>
    </div>
  );
};

export default ColumnRelationCell;
