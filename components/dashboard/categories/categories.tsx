'use client';
import {
  capitalize,
  humanReadableDate,
  humanReadableTime
} from '@/functions/utility';
import { categories } from '@/lib/config';
import { Category as ICategory } from '@/lib/interface';
import { Icon } from '@iconify/react/dist/iconify.js';
import {
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Table,
  Chip,
  Selection,
  Avatar,
  Dropdown,
  DropdownTrigger,
  Button,
  DropdownMenu,
  DropdownItem,
  SortDescriptor,
  Input,
  Pagination,
  Modal,
  ModalHeader,
  ModalBody,
  ModalContent,
  ModalFooter,
  useDisclosure
} from '@heroui/react';
import { useFormik } from 'formik';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';

interface HotelProps {
  categories: ICategory[];
}

const INITIAL_VISIBLE_COLUMNS = [
  'name',
  'uid',
  'addedBy',
  'updatedAt',
  'actions'
];

export default function Hotels({ categories }: HotelProps) {
  const deleteModal = useDisclosure();
  const router = useRouter();
  const [selected, setSelected] = React.useState<ICategory | null>(null);
  const [filterValue, setFilterValue] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<Selection>('all');

  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(
    new Set([])
  );
  const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [rowsPerPage, setRowsPerPage] = React.useState(1000);
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending'
  });

  const [page, setPage] = React.useState(1);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === 'all') return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  let filteredItems = React.useMemo(() => {
    let filteredLinks = [...categories];

    if (hasSearchFilter) {
      filteredLinks = filteredLinks.filter(
        (category) =>
          category.name.toLowerCase().includes(filterValue.toLowerCase()) ||
          category.uid.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    return filteredLinks;
  }, [categories, filterValue, categoryFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a: ICategory, b: ICategory) => {
      const first = a[sortDescriptor.column as keyof ICategory] as string;
      const second = b[sortDescriptor.column as keyof ICategory] as string;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const renderCell = React.useCallback(
    (category: ICategory, columnKey: React.Key) => {
      const cellValue = category[columnKey as keyof ICategory];
      switch (columnKey) {
        case 'name':
          return (
            <>
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <p className="text-bold whitespace-nowrap text-sm capitalize">
                    {category.name}
                  </p>
                </div>
              </div>
            </>
          );
        case 'addedBy':
          return (
            <p className="text-bold whitespace-nowrap text-sm">
              {category.addedBy}
            </p>
          );
        case 'updatedAt':
          return (
            <>
              <p className="text-bold whitespace-nowrap text-sm capitalize">
                {humanReadableDate(category.updatedAt)}
              </p>
              <p className="text-bold whitespace-nowrap text-sm capitalize text-default-400">
                {humanReadableTime(category.updatedAt)}
              </p>
            </>
          );
        case 'actions':
          return (
            <Dropdown>
              <DropdownTrigger>
                <Button variant="light" isIconOnly>
                  <Icon icon="tabler:dots-vertical" fontSize={18} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem
                  key={'view'}
                  startContent={
                    <Icon icon="ic:round-view-in-ar" fontSize={20} />
                  }
                  as={Link}
                  href={`/category/${category.uid}`}
                >
                  View
                </DropdownItem>
                <DropdownItem
                  key={'edit'}
                  startContent={<Icon icon="tabler:edit" fontSize={20} />}
                  as={Link}
                  href={`/${category.uid}/edit`}
                >
                  Edit
                </DropdownItem>
                <DropdownItem
                  key={'delete'}
                  startContent={<Icon icon="tabler:trash" fontSize={20} />}
                  className="text-danger"
                  color="danger"
                  onPress={() => {
                    setSelected(category);
                    deleteModal.onOpen();
                  }}
                >
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          );
        default:
          return cellValue;
      }
    },
    []
  );

  const onNextPage = React.useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const onPreviousPage = React.useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const onRowsPerPageChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setRowsPerPage(Number(e.target.value));
      setPage(1);
    },
    []
  );

  const onSearchChange = React.useCallback((value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue('');
    }
  }, []);

  const onClear = React.useCallback(() => {
    setFilterValue('');
    setPage(1);
  }, []);

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search anything..."
            startContent={<Icon icon="tabler:search" />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={
                    <Icon icon={'tabler:chevron-down'} fontSize={16} />
                  }
                  variant="flat"
                >
                  Columns
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode="multiple"
                onSelectionChange={setVisibleColumns}
              >
                {columns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {capitalize(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Button
              color="primary"
              endContent={<Icon icon={'tabler:plus'} />}
              as={Link}
              href="/category/new"
            >
              Add New
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-small text-default-400">
            Total {categories.length} categories
          </span>
          <label className="flex items-center text-small text-default-400">
            Rows per page:
            <select
              className="bg-transparent text-small text-default-400 outline-none"
              onChange={onRowsPerPageChange}
            >
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="1000">1000</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [
    filterValue,
    visibleColumns,
    onSearchChange,
    onRowsPerPageChange,
    categories.length,
    hasSearchFilter,
    categoryFilter
  ]);

  const bottomContent = React.useMemo(() => {
    return (
      <div className="flex items-center justify-between px-2 py-2">
        <span className="w-[30%] text-small text-default-400">
          {selectedKeys === 'all'
            ? 'All items selected'
            : `${selectedKeys.size} of ${filteredItems.length} selected`}
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
        <div className="hidden w-[30%] justify-end gap-2 sm:flex">
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={onPreviousPage}
          >
            Previous
          </Button>
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={onNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

  const formik = useFormik({
    initialValues: {},
    onSubmit: async () => {
      try {
        await fetch(`/api/category/${selected?.uid}`, {
          method: 'DELETE'
        });
        toast.success('Category deleted successfully');
        deleteModal.onClose();
        // refresh data
        router.refresh();
      } catch (e) {
        toast.error('Failed to delete');
        console.error(e);
      }
    }
  });

  return (
    <>
      <Table
        aria-label="Hotels List"
        isHeaderSticky
        bottomContent={bottomContent}
        bottomContentPlacement="outside"
        classNames={{
          wrapper: 'max-h-[382px]'
        }}
        selectedKeys={selectedKeys}
        //   selectionMode="multiple"
        sortDescriptor={sortDescriptor}
        topContent={topContent}
        topContentPlacement="outside"
        onSelectionChange={setSelectedKeys}
        onSortChange={setSortDescriptor}
        onRowAction={(key) => {
          router.push(`/category/${key}`);
        }}
        className="cursor-pointer"
      >
        <TableHeader columns={headerColumns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === 'actions' ? 'center' : 'start'}
              allowsSorting={column.sortable}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={sortedItems} emptyContent={'No categories found'}>
          {(item) => (
            <TableRow
              key={item.uid}
              className="transition-all hover:bg-default-100"
            >
              {(columnKey) => (
                // @ts-ignore
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex justify-end">
        <Button
          onPress={() => {
            signOut();
          }}
        >
          Logout
        </Button>
      </div>
      <Modal
        backdrop="blur"
        scrollBehavior="inside"
        isOpen={deleteModal.isOpen}
        onOpenChange={deleteModal.onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex-col items-center">
                <Icon
                  icon="tabler:trash-x"
                  fontSize={54}
                  className="text-danger"
                />
                <h2 className="mt-4 max-w-xs text-center text-sm font-[400]">
                  Are you sure you permanently want to delete{' '}
                  <span className="font-semibold">{selected?.name}</span> from
                  the Database?
                </h2>
              </ModalHeader>
              <ModalBody className="items-center text-sm">
                You can&apos;t undo this action.
              </ModalBody>
              <ModalFooter className="flex-col-reverse sm:flex-row">
                <Button fullWidth variant="flat" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="danger"
                  variant="flat"
                  fullWidth
                  isLoading={formik.isSubmitting}
                  onPress={() => formik.handleSubmit()}
                >
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

const columns = [
  { name: 'NAME', uid: 'name', sortable: true },
  { name: 'UID', uid: 'uid' },
  { name: 'ADDED BY', uid: 'addedBy' },
  { name: 'UPDATED AT', uid: 'updatedAt', sortable: true },
  { name: 'ACTIONS', uid: 'actions' }
];
