import { z } from 'zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCrmStore } from '@/lib/crm-store'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { useLanguage } from '@/context/language-provider'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SelectDropdown } from '@/components/select-dropdown'
import { type Task } from '../data/schema'
import { useTasks } from './tasks-provider'

type TaskMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Task
}

const getTaskFormSchema = (english: boolean) =>
  z.object({
    title: z
      .string()
      .min(
        1,
        english ? 'Title is required.' : 'Sarlavhani kiritish shart.'
      ),
    status: z
      .string()
      .min(
        1,
        english ? 'Please select a status.' : 'Iltimos, holatni tanlang.'
      ),
    label: z
      .string()
      .min(
        1,
        english ? 'Please select a label.' : 'Iltimos, kategoriyani tanlang.'
      ),
    priority: z
      .string()
      .min(
        1,
        english
          ? 'Please choose a priority.'
          : 'Iltimos, muhimlik darajasini tanlang.'
      ),
    assignee: z
      .string()
      .min(
        1,
        english
          ? 'Please assign this task.'
          : 'Iltimos, mas’ul xodimni tanlang.'
      ),
    description: z.string().optional(),
    dueDate: z.string().optional(),
  })

type TaskForm = z.infer<ReturnType<typeof getTaskFormSchema>>

export function TasksMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: TaskMutateDrawerProps) {
  const isUpdate = !!currentRow
  const { language } = useLanguage()
  const english = language === 'en'
  const { createTask, updateTask } = useTasks()
  const students = useCrmStore((state) => state.students)

  const currentSchema = useMemo(() => getTaskFormSchema(english), [english])

  const form = useForm<TaskForm>({
    resolver: zodResolver(currentSchema),
    defaultValues: currentRow ?? {
      title: '',
      status: '',
      label: '',
      priority: '',
      assignee: '',
      description: '',
      dueDate: '',
    },
  })

  const onSubmit = (data: TaskForm) => {
    if (currentRow) {
      updateTask(currentRow.id, data)
    } else {
      createTask(data)
    }
    onOpenChange(false)
    form.reset()
    showSubmittedData(
      data,
      currentRow
        ? english
          ? 'Task updated successfully.'
          : 'Vazifa muvaffaqiyatli yangilandi.'
        : english
          ? 'Task created successfully.'
          : 'Vazifa muvaffaqiyatli yaratildi.'
    )
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        form.reset()
      }}
    >
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-start'>
          <SheetTitle>
            {isUpdate
              ? english
                ? 'Update task'
                : 'Vazifani tahrirlash'
              : english
                ? 'Create task'
                : 'Vazifa yaratish'}
          </SheetTitle>
          <SheetDescription>
            {isUpdate
              ? english
                ? 'Update the task information.'
                : 'Vazifa ma’lumotlarini yangilang.'
              : english
                ? 'Add a new task with the necessary information.'
                : 'Kerakli ma’lumotlar bilan yangi vazifa yarating.'}
            {english
              ? ' Click save when you are done.'
              : ' Tugatgach saqlashni bosing.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='tasks-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-6 overflow-y-auto px-4'
          >
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{english ? 'Title' : 'Sarlavha'}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        english ? 'Enter a title' : 'Sarlavhani kiriting'
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{english ? 'Status' : 'Holati'}</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    isControlled
                    onValueChange={field.onChange}
                    placeholder={english ? 'Select status' : 'Holatni tanlang'}
                    items={[
                      {
                        label: english ? 'In Progress' : 'Jarayonda',
                        value: 'in progress',
                      },
                      {
                        label: english ? 'Backlog' : 'Rejada',
                        value: 'backlog',
                      },
                      {
                        label: english ? 'Todo' : 'Bajarilishi kerak',
                        value: 'todo',
                      },
                      {
                        label: english ? 'Canceled' : 'Bekor qilingan',
                        value: 'canceled',
                      },
                      { label: english ? 'Done' : 'Bajarilgan', value: 'done' },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='label'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{english ? 'Category' : 'Kategoriya'}</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    isControlled
                    onValueChange={field.onChange}
                    placeholder={
                      english ? 'Select category' : 'Kategoriyani tanlang'
                    }
                    items={[
                      {
                        label: english ? 'Documentation' : 'Hujjatlashtirish',
                        value: 'documentation',
                      },
                      {
                        label: english ? 'Feature' : 'Funksiya',
                        value: 'feature',
                      },
                      { label: english ? 'Bug' : 'Xato', value: 'bug' },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='assignee'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {english ? 'Assign to' : 'Mas’ul xodim'}
                  </FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    isControlled
                    onValueChange={field.onChange}
                    placeholder={
                      english ? 'Choose a team member' : 'Xodimni tanlang'
                    }
                    items={[
                      {
                        label: english
                          ? 'All academy team'
                          : 'Akademiya jamoasi',
                        value: 'Akademiya jamoasi',
                      },
                      ...students.map((student) => ({
                        label: student.name,
                        value: student.name,
                      })),
                      {
                        label: 'Temurbek · O‘qituvchi',
                        value: 'Temurbek · O‘qituvchi',
                      },
                      { label: 'Moliya bo‘limi', value: 'Moliya bo‘limi' },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {english ? 'Details' : 'Vazifa tafsilotlari'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        english
                          ? 'What should be done?'
                          : 'Nima bajarilishi kerak?'
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='dueDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{english ? 'Due date' : 'Muddat'}</FormLabel>
                  <FormControl>
                    <Input type='date' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='priority'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{english ? 'Priority' : 'Muhimlik'}</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    isControlled
                    onValueChange={field.onChange}
                    placeholder={
                      english ? 'Select priority' : 'Muhimlikni tanlang'
                    }
                    items={[
                      {
                        label: english ? 'Critical' : 'Juda yuqori',
                        value: 'critical',
                      },
                      { label: english ? 'High' : 'Yuqori', value: 'high' },
                      { label: english ? 'Medium' : 'O‘rta', value: 'medium' },
                      { label: english ? 'Low' : 'Past', value: 'low' },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline'>{english ? 'Close' : 'Yopish'}</Button>
          </SheetClose>
          <Button form='tasks-form' type='submit'>
            {english ? 'Save changes' : 'Saqlash'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
