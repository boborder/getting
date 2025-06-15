import { Form } from 'react-router'
import type { Route } from './+types/dashboard'

export async function loader({context}: Route.LoaderArgs) {
  const { isProduction } = context;
  return {
    isProduction,
  };
}

export async function action({request}: Route.ActionArgs) {
  const formData = await request.formData()
  const name = formData.get('name')
  return { name }
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <h1>Dashboard</h1>
      <p>{loaderData ? 'Production' : 'Development'}</p>
      <Form method="post">
        <input type="text" name="name" />
        <button type="submit">Submit</button>
      </Form>
    </>
  )
}
